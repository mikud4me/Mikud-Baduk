import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cacheRefinanceStrategyResult,
  generateRefinanceStrategyMixes,
  getCachedRefinanceStrategyResult,
} from '../supabase/functions/_shared/refinance-mixes.js';
import {
  canRestoreRefinanceMixes,
  getRefinanceMixPresentation,
} from '../src/utils/refinanceMixState.js';

const baseContext = {
  analysisRevision: 'fixture-v1',
  mixBasePrincipal: 1_000_000,
  actualRemainingBalance: 1_000_000,
  isSurgicalMode: false,
  goldenTracks: [],
  existingMonthlyPayment: 7_000,
  totalOldPayments: 1_500_000,
  weightedPeriodMonths: 240,
  earlyRepaymentFee: 10_000,
  bankFees: 360,
  allTracks: [{
    track_type: 'קבועה לא צמודה',
    remaining_balance: 1_000_000,
    interest_rate: 5,
    remaining_months: 240,
    is_index_linked: false,
  }],
  expectedAnnualInflation: 2.5,
  marketRates: { prime: 5, fixed_unlinked: 4.7, variable_unlinked: 4.6 },
  strategyPeriods: { savings: 15, cashflow: 30 },
};

function annuity(principal, annualRatePercent, years) {
  const monthlyRate = annualRatePercent / 100 / 12;
  const months = years * 12;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * monthlyRate * growth / (growth - 1);
}

function legacyCalculateMix(context, definitions) {
  let totalMonthly = 0;
  let totalPayments = 0;
  const tracks = definitions.map((definition) => {
    const amount = context.mixBasePrincipal * definition.percentage / 100;
    const monthly = annuity(amount, definition.interest_rate, definition.period_years);
    totalMonthly += monthly;
    totalPayments += monthly * definition.period_years * 12;
    return {
      amount: Math.round(amount),
      percentage: Math.round((amount / context.mixBasePrincipal) * 1000) / 10,
      monthly_payment: Math.round(monthly),
    };
  });

  const periodMonths = definitions[0].period_years * 12;
  let oldCostForPeriod = context.totalOldPayments;
  if (periodMonths !== context.weightedPeriodMonths) {
    oldCostForPeriod = context.allTracks.reduce((sum, track) => {
      const effectiveMonths = Math.min(track.remaining_months || context.weightedPeriodMonths, periodMonths);
      return sum + annuity(track.remaining_balance, track.interest_rate, effectiveMonths / 12) * effectiveMonths;
    }, 0);
  }
  const grossSavings = oldCostForPeriod - totalPayments;
  const netSavings = grossSavings - context.earlyRepaymentFee - context.bankFees;
  const totalMonthlyPayment = Math.round(totalMonthly);

  return {
    tracks,
    total_monthly_payment: totalMonthlyPayment,
    total_interest: Math.round(totalPayments - context.mixBasePrincipal),
    monthly_savings: Math.round(context.existingMonthlyPayment - totalMonthlyPayment),
    total_savings: Math.round(grossSavings),
    net_savings: Math.round(netSavings),
    is_worthwhile: netSavings > 10_000,
  };
}

test('uses the selected existing strategy period without changing the mix profiles', () => {
  const savings = generateRefinanceStrategyMixes(baseContext, 'savings');
  const cashflow = generateRefinanceStrategyMixes(baseContext, 'cashflow');

  assert.equal(savings.length, 3);
  assert.equal(cashflow.length, 3);
  assert.deepEqual(savings.map((mix) => mix.mix_number), [1, 2, 3]);
  assert.deepEqual(
    savings.map((mix) => mix.tracks.map((track) => track.percentage)),
    [[27, 46, 27], [33, 34, 33], [47, 38, 15]],
  );
  assert.ok(savings.every((mix) => mix.strategy_period_years === 15));
  assert.ok(cashflow.every((mix) => mix.strategy_period_years === 30));
  assert.ok(cashflow[1].total_monthly_payment < savings[1].total_monthly_payment);
});

test('matches the previous calculateMix outputs for identical inputs and period', () => {
  const [_, balanced] = generateRefinanceStrategyMixes(baseContext, 'savings');
  const definitions = [
    { percentage: 33, interest_rate: 5, period_years: 15 },
    { percentage: 34, interest_rate: 4.7, period_years: 15 },
    { percentage: 33, interest_rate: 4.6, period_years: 15 },
  ];
  const expected = legacyCalculateMix(baseContext, definitions);

  assert.equal(balanced.mix_number, 2);
  assert.equal(balanced.risk_level, 'balanced');
  assert.deepEqual(
    balanced.tracks.map(({ amount, percentage, monthly_payment }) => ({ amount, percentage, monthly_payment })),
    expected.tracks,
  );
  for (const field of [
    'total_monthly_payment',
    'total_interest',
    'monthly_savings',
    'total_savings',
    'net_savings',
    'is_worthwhile',
  ]) {
    assert.equal(balanced[field], expected[field], field);
  }
});

test('preserves golden tracks in surgical refinance mixes', () => {
  const context = {
    ...baseContext,
    mixBasePrincipal: 600_360,
    isSurgicalMode: true,
    goldenTracks: [{
      track_type: 'פריים',
      remaining_balance: 400_000,
      interest_rate: 3.1,
      remaining_months: 180,
    }],
  };

  const mixes = generateRefinanceStrategyMixes(context, 'cashflow');
  mixes.forEach((mix) => {
    const golden = mix.tracks.find((track) => track.is_golden);
    assert.ok(golden);
    assert.equal(golden.amount, 400_000);
    assert.equal(golden.label, '⭐ מסלול נשמר');
  });
});

test('rejects unknown strategies', () => {
  assert.throws(
    () => generateRefinanceStrategyMixes(baseContext, 'unknown'),
    /Invalid refinance mix strategy/,
  );
});

test('caches each strategy independently and invalidates both on a new analysis revision', () => {
  const savings = { analysisRevision: 'document-1', mixes: [{ mix_number: 2 }] };
  const cashflow = { analysisRevision: 'document-1', mixes: [{ mix_number: 2 }] };
  let cache = cacheRefinanceStrategyResult({}, 'savings', savings);
  cache = cacheRefinanceStrategyResult(cache, 'cashflow', cashflow);

  assert.equal(getCachedRefinanceStrategyResult(cache, 'document-1', 'savings'), savings);
  assert.equal(getCachedRefinanceStrategyResult(cache, 'document-1', 'cashflow'), cashflow);
  assert.equal(getCachedRefinanceStrategyResult(cache, 'document-2', 'savings'), null);
  assert.equal(getCachedRefinanceStrategyResult(cache, 'document-2', 'cashflow'), null);
});

test('restores only a previously calculated strategy after reload', () => {
  assert.equal(canRestoreRefinanceMixes('savings', ['savings'], true), true);
  assert.equal(canRestoreRefinanceMixes('cashflow', ['savings'], true), false);
  assert.equal(canRestoreRefinanceMixes('savings', ['savings'], false), false);
});

test('keeps mixes blurred and out of the PDF until payment, then unlocks without recalculation', () => {
  const mixes = [{ mix_number: 1 }, { mix_number: 2 }, { mix_number: 3 }];
  const beforePayment = getRefinanceMixPresentation(mixes, false);
  assert.equal(beforePayment.showPayment, true);
  assert.equal(beforePayment.isBlurred, true);
  assert.deepEqual(beforePayment.reportMixes, []);

  const afterPayment = getRefinanceMixPresentation(mixes, true);
  assert.equal(afterPayment.showPayment, false);
  assert.equal(afterPayment.isBlurred, false);
  assert.equal(afterPayment.reportMixes, mixes);
});
