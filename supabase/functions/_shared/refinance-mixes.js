// No `prime` entry — a non-green prime balance merges into the new מ.ל.צ
// pool and is priced/labeled as ordinary variable-unlinked, per spec.
const TRACK_TYPES = {
  fixed: 'קבועה לא צמודה',
  fixedLinked: 'קבועה צמודה',
  variable: 'משתנה לא צמודה',
  variableLinked: 'משתנה צמודה',
};

export function getCachedRefinanceMixResult(cachedResult, analysisRevision) {
  return cachedResult?.analysisRevision === analysisRevision && Array.isArray(cachedResult?.mixes)
    ? cachedResult
    : null;
}

export function cacheRefinanceMixResult(result) {
  return result;
}

function annuityPayment(principal, annualRatePercent, months) {
  const monthlyRate = annualRatePercent / 100 / 12;
  if (!principal || !months) return 0;
  if (!monthlyRate) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * (monthlyRate * growth) / (growth - 1);
}

function linkedCost(principal, annualRatePercent, months, annualInflationPercent) {
  const monthlyRate = annualRatePercent / 100 / 12;
  const inflationRate = Math.pow(1 + annualInflationPercent / 100, 1 / 12) - 1;
  let balance = principal;
  let totalPaid = 0;

  for (let index = 0; index < months; index += 1) {
    balance *= 1 + inflationRate;
    const remainingMonths = months - index;
    const payment = annuityPayment(balance, annualRatePercent, remainingMonths);
    totalPaid += payment;
    balance -= payment - balance * monthlyRate;
    if (balance < 0) balance = 0;
  }

  return totalPaid;
}

const isFixedType = (type) => String(type || '').toLowerCase().includes('קבוע');
const isVariableType = (type) => {
  const t = String(type || '').toLowerCase();
  return t.includes('משתנה') || t.includes('פריים');
};
const isLinkedType = (type) => {
  const t = String(type || '');
  return t.includes('צמוד') && !t.includes('לא צמוד');
};

// Bank of Israel refinance spec: the generic 33%-of-mix fixed floor that
// applies to a new-money mortgage does NOT apply to a refinance. Instead the
// new mix's total fixed-rate balance (green fixed tracks kept untouched +
// the new קל"צ/ק"צ) must never be LESS than the fixed-rate balance the
// borrower already had. By construction (every non-green fixed shekel flows
// into the new fixed track, nothing fixed ever becomes variable) this should
// always hold — the check exists as a guard against that invariant breaking,
// not as something expected to trigger and get corrected in normal use.
function validateFixedFloor(calculatedTracks, oldFixedAmount) {
  const newFixedAmount = calculatedTracks
    .filter((track) => isFixedType(track.track_type))
    .reduce((sum, track) => sum + (Number(track.amount) || 0), 0);
  const isCompliant = newFixedAmount >= oldFixedAmount - 1; // 1-shekel rounding tolerance

  return {
    isCompliant,
    oldFixedAmount: Math.round(oldFixedAmount),
    newFixedAmount: Math.round(newFixedAmount),
    errors: isCompliant ? [] : [{
      type: 'REGULATORY',
      severity: 'CRITICAL',
      message: `סך המסלולים הקבועים בתמהיל החדש (₪${Math.round(newFixedAmount).toLocaleString()}) נמוך מסך הקבועים במשכנתא המקורית (₪${Math.round(oldFixedAmount).toLocaleString()})`,
    }],
  };
}

function buildCalculator(context) {
  const {
    mixBasePrincipal,
    actualRemainingBalance,
    isSurgicalMode,
    goldenTracks = [],
    existingMonthlyPayment,
    totalOldPayments,
    weightedPeriodMonths,
    earlyRepaymentFee,
    bankFees,
    allTracks = [],
    expectedAnnualInflation,
    monthlyIncome = 0,
  } = context;

  const goldenMonthly = isSurgicalMode
    ? goldenTracks.reduce((sum, track) => sum + annuityPayment(
        Number(track.remaining_balance) || 0,
        Number(track.interest_rate) || 0,
        Number(track.remaining_months) || 0,
      ), 0)
    : 0;

  // The original mortgage's total fixed-rate balance (green + non-green,
  // linked + unlinked) — the floor the new mix's fixed portion must not fall
  // below. See validateFixedFloor above.
  const oldFixedAmount = allTracks
    .filter((track) => isFixedType(track.track_type))
    .reduce((sum, track) => sum + (Number(track.remaining_balance) || 0), 0);

  const calculateMix = (trackDefinitions) => {
    let totalMonthly = 0;
    let totalPayments = 0;
    const calculatedTracks = trackDefinitions.map((definition) => {
      const amount = definition.exact_amount || (mixBasePrincipal * (definition.percentage / 100));
      const months = definition.period_years * 12;
      const monthly = annuityPayment(amount, definition.interest_rate, months);
      totalMonthly += monthly;
      // A CPI-linked new track's balance grows with inflation over its life
      // (the degradation stages in the payment-matching mix can create one),
      // so its true lifetime cost is higher than payment × months — computed
      // the same way linkedCost() already computes it for the borrower's
      // existing linked tracks elsewhere in this file. The *displayed*
      // monthly payment, and every payment-tolerance/DTI comparison below,
      // still uses the plain nominal annuity figure above — that's the real
      // amount due this month; only the lifetime total needs the CPI
      // adjustment layered on top.
      totalPayments += definition.is_index_linked
        ? linkedCost(amount, definition.interest_rate, months, expectedAnnualInflation)
        : monthly * months;

      return {
        track_type: definition.track_type,
        amount: Math.round(amount),
        percentage: Math.round((amount / mixBasePrincipal) * 1000) / 10,
        interest_rate: definition.interest_rate,
        period_years: definition.period_years,
        monthly_payment: Math.round(monthly),
        is_index_linked: Boolean(definition.is_index_linked),
      };
    });

    if (isSurgicalMode) {
      goldenTracks.forEach((track) => {
        const balance = Number(track.remaining_balance) || 0;
        const months = Number(track.remaining_months) || 0;
        calculatedTracks.push({
          track_type: track.track_type,
          amount: Math.round(balance),
          percentage: Math.round((balance / actualRemainingBalance) * 1000) / 10,
          interest_rate: Number(track.interest_rate) || 0,
          period_years: Math.round(months / 12),
          monthly_payment: Math.round(annuityPayment(balance, Number(track.interest_rate) || 0, months)),
          is_index_linked: isLinkedType(track.track_type),
          is_golden: true,
          label: '⭐ מסלול נשמר',
        });
      });
    }

    // The new tracks can each carry their own period (the payment-matching
    // mix iterates one at a time), so the "how long is this mix" reference
    // for the old-cost comparison is the longest of them — the full span the
    // borrower will actually still be paying something new.
    const mixPeriodMonths = Math.max(...trackDefinitions.map((d) => d.period_years)) * 12;
    let oldCostForPeriod = totalOldPayments;

    if (mixPeriodMonths !== weightedPeriodMonths && mixPeriodMonths > 0) {
      oldCostForPeriod = 0;
      allTracks.forEach((track) => {
        const annualRate = Number(track.interest_rate) || 0;
        const balance = Number(track.remaining_balance) || 0;
        if (balance <= 0) return;
        const effectiveMonths = Math.min(
          Number(track.remaining_months) || weightedPeriodMonths,
          mixPeriodMonths,
        );
        oldCostForPeriod += track.is_index_linked
          ? linkedCost(balance, annualRate, effectiveMonths, expectedAnnualInflation)
          : annuityPayment(balance, annualRate, effectiveMonths) * effectiveMonths;
      });
    }

    const grossSavings = oldCostForPeriod - totalPayments;
    const netSavings = grossSavings - earlyRepaymentFee - bankFees;
    const totalMonthlyWithGolden = Math.round(totalMonthly + goldenMonthly);

    return {
      tracks: calculatedTracks,
      total_monthly_payment: totalMonthlyWithGolden,
      total_interest: Math.round(totalPayments - mixBasePrincipal),
      monthly_savings: Math.round(existingMonthlyPayment - totalMonthlyWithGolden),
      total_savings: Math.round(grossSavings),
      net_savings: Math.round(netSavings),
      is_worthwhile: netSavings > 10000,
      // Bank of Israel DTI gate: flag (never block) a mix whose total payment
      // would exceed 40% of net monthly income. No income on file means we
      // can't assess it, so it isn't held against the mix.
      is_valid: !monthlyIncome || totalMonthlyWithGolden <= monthlyIncome * 0.4,
      compliance: validateFixedFloor(calculatedTracks, oldFixedAmount),
    };
  };

  return { calculateMix };
}

// Sums the non-green balance for one group (fixed-type or variable-type) and
// the balance-weighted average of its remaining periods — the exact "average
// proportional to amounts" the period-matching mix (and the payment-matching
// mix's non-handle track) is built from.
function summarizeGroup(tracks) {
  const amount = tracks.reduce((sum, t) => sum + (Number(t.remaining_balance) || 0), 0);
  if (amount <= 0) return { amount: 0, periodYears: 0 };
  const weightedMonths = tracks.reduce(
    (sum, t) => sum + (Number(t.remaining_months) || 0) * (Number(t.remaining_balance) || 0),
    0,
  ) / amount;
  return { amount, periodYears: Math.max(1, Math.round(weightedMonths / 12)) };
}

// Mix 2 — payment-matching. Iterates the "handle" track's period (new קל"צ by
// default, falling back to the new מ.ל.צ when there's no non-green fixed
// balance to run on) while the other new track stays at its own natural
// weighted period, searching for the shortest whole-year period that brings
// the total payment (including any kept green tracks) into [—, +5%] of the
// original payment. If extending the period alone can't get there even at
// the age-85/30-year cap, degrades in stages: (B) convert the new fixed
// track to CPI-linked and keep iterating its period; (C) also convert the
// new variable track to CPI-linked and iterate both jointly, picking
// whichever combination lands closest to the target.
function buildPaymentMatchMix({
  fixedAmount, variableAmount, fixedPeriodYears, variablePeriodYears,
  fixedUnlinkedRate, variableUnlinkedRate, fixedLinkedRate, variableLinkedRate,
  targetMonthly, maxAllowedYears, calculateMix,
}) {
  const ceiling = targetMonthly * 1.05;
  const handleIsFixed = fixedAmount > 0;
  const otherFixedYears = Math.min(maxAllowedYears, Math.max(1, fixedPeriodYears || variablePeriodYears || 20));
  const otherVariableYears = Math.min(maxAllowedYears, Math.max(1, variablePeriodYears || fixedPeriodYears || 20));

  const buildDefinitions = (fixedYears, variableYears, fixedLinked, variableLinked) => {
    const defs = [];
    if (fixedAmount > 0) {
      defs.push({
        track_type: fixedLinked ? TRACK_TYPES.fixedLinked : TRACK_TYPES.fixed,
        exact_amount: fixedAmount,
        interest_rate: fixedLinked ? fixedLinkedRate : fixedUnlinkedRate,
        period_years: fixedYears,
        is_index_linked: fixedLinked,
      });
    }
    if (variableAmount > 0) {
      defs.push({
        track_type: variableLinked ? TRACK_TYPES.variableLinked : TRACK_TYPES.variable,
        exact_amount: variableAmount,
        interest_rate: variableLinked ? variableLinkedRate : variableUnlinkedRate,
        period_years: variableYears,
        is_index_linked: variableLinked,
      });
    }
    return defs;
  };

  const tryPeriod = (fixedYears, variableYears, fixedLinked, variableLinked) => (
    calculateMix(buildDefinitions(fixedYears, variableYears, fixedLinked, variableLinked))
  );

  // Stage A — extend the handle track's period only.
  for (let y = 1; y <= maxAllowedYears; y += 1) {
    const fixedYears = handleIsFixed ? y : otherFixedYears;
    const variableYears = handleIsFixed ? otherVariableYears : y;
    const calculated = tryPeriod(fixedYears, variableYears, false, false);
    if (calculated.total_monthly_payment <= ceiling) {
      return { calculated, degradationStage: 0 };
    }
  }

  // Stage B — convert the new fixed track to linked (ק"צ), keep iterating its
  // period alone; skip entirely if there's no fixed track to convert.
  if (fixedAmount > 0) {
    for (let y = 1; y <= maxAllowedYears; y += 1) {
      const calculated = tryPeriod(y, otherVariableYears, true, false);
      if (calculated.total_monthly_payment <= ceiling) {
        return { calculated, degradationStage: 2 };
      }
    }
  }

  // Stage C — also convert the new variable track to linked (מ"צ); joint
  // search over both periods for whichever combination lands closest to (and
  // under, where possible) the ceiling.
  if (variableAmount > 0) {
    let best = null;
    for (let fy = 1; fy <= maxAllowedYears; fy += 1) {
      for (let vy = 1; vy <= maxAllowedYears; vy += 1) {
        const calculated = tryPeriod(fy, vy, fixedAmount > 0, true);
        const withinRange = calculated.total_monthly_payment <= ceiling;
        const diff = Math.abs(calculated.total_monthly_payment - ceiling);
        if (!best || (withinRange && !best.withinRange) || (withinRange === best.withinRange && diff < best.diff)) {
          best = { calculated, diff, withinRange };
        }
      }
    }
    if (best) return { calculated: best.calculated, degradationStage: 3 };
  }

  // Nothing reached the range even at the regulatory cap — return the
  // longest, fullest-linked attempt as the closest available result.
  const fallback = tryPeriod(maxAllowedYears, maxAllowedYears, fixedAmount > 0, variableAmount > 0);
  return { calculated: fallback, degradationStage: 3 };
}

export function generateRefinanceMixes(context) {
  // Prime never becomes its own new track — a non-green prime balance merges
  // into the new מ.ל.צ pool and is priced at the variable-unlinked rate, per
  // spec, so prime's own rate is never referenced here (it's still used
  // elsewhere, e.g. classifying an existing prime track as green/red).
  const rates = context.marketRates || {};
  const fixedUnlinkedRate = Number(rates.fixed_unlinked);
  const fixedLinkedRate = Number(rates.fixed_linked);
  const variableUnlinkedRate = Number(rates.variable_unlinked);
  const variableLinkedRate = Number(rates.variable_linked);
  if (![fixedUnlinkedRate, fixedLinkedRate, variableUnlinkedRate, variableLinkedRate].every(Number.isFinite)) {
    throw new Error('The refinance rate snapshot is incomplete');
  }

  const maxAllowedYears = Number(context.maxAllowedYears);
  if (!Number.isFinite(maxAllowedYears) || maxAllowedYears <= 0) {
    throw new Error('The maximum allowed period is unavailable');
  }

  const allTracks = context.allTracks || [];
  const nonGreenTracks = allTracks.filter((track) => !track.is_green);
  const nonGreenFixedTracks = nonGreenTracks.filter((track) => isFixedType(track.track_type));
  const nonGreenVariableTracks = nonGreenTracks.filter((track) => isVariableType(track.track_type));

  const fixedGroup = summarizeGroup(nonGreenFixedTracks);
  const variableGroup = summarizeGroup(nonGreenVariableTracks);
  const totalNewRaw = fixedGroup.amount + variableGroup.amount;
  if (totalNewRaw <= 0) {
    throw new Error('No non-green balance is available to refinance');
  }

  // Fees ride along proportionally on whichever new components actually exist.
  const totalFees = (Number(context.earlyRepaymentFee) || 0) + (Number(context.bankFees) || 0);
  const fixedAmount = fixedGroup.amount + totalFees * (fixedGroup.amount / totalNewRaw);
  const variableAmount = variableGroup.amount + totalFees * (variableGroup.amount / totalNewRaw);
  const fixedPeriodYears = Math.min(maxAllowedYears, fixedGroup.periodYears || variableGroup.periodYears || 20);
  const variablePeriodYears = Math.min(maxAllowedYears, variableGroup.periodYears || fixedGroup.periodYears || 20);

  const { calculateMix } = buildCalculator(context);

  const buildDirectMix = (fixedYears, variableYears) => {
    const defs = [];
    if (fixedAmount > 0) defs.push({ track_type: TRACK_TYPES.fixed, exact_amount: fixedAmount, interest_rate: fixedUnlinkedRate, period_years: fixedYears });
    if (variableAmount > 0) defs.push({ track_type: TRACK_TYPES.variable, exact_amount: variableAmount, interest_rate: variableUnlinkedRate, period_years: variableYears });
    return calculateMix(defs);
  };

  const finalizeMix = (calculated, meta) => {
    const mix = {
      ...calculated,
      ...meta,
      advantages: [...meta.advantages, `חיסכון: ₪${calculated.monthly_savings.toLocaleString('he-IL')}`],
    };
    delete mix.periodYears;
    return mix;
  };

  // ─── Mix 1 — Period-matching: no iteration, mirrors the original weighted periods. ───
  const mix1 = finalizeMix(buildDirectMix(fixedPeriodYears, variablePeriodYears), {
    mix_number: 1,
    mix_name: 'תמהיל 1: השוואת תקופה',
    risk_level: 'conservative',
    strategy: 'period-match',
    advantages: ['משמר את משך החיים המקורי של ההלוואה', 'ללא איטרציות — התוצאה הישירה ביותר'],
    disadvantages: ['אין התחשבות בגובה ההחזר החודשי החדש'],
    recommended_for: 'לקוחות שרוצים לשמור על אותה תקופת סיום כמו היום',
  });

  // ─── Mix 2 — Payment-matching: iterate + staged degradation. ───
  const mix2Result = buildPaymentMatchMix({
    fixedAmount, variableAmount, fixedPeriodYears, variablePeriodYears,
    fixedUnlinkedRate, variableUnlinkedRate, fixedLinkedRate, variableLinkedRate,
    targetMonthly: Number(context.existingMonthlyPayment) || 0,
    maxAllowedYears, calculateMix,
  });
  const mix2 = finalizeMix(mix2Result.calculated, {
    mix_number: 2,
    mix_name: 'תמהיל 2: השוואת תשלום',
    risk_level: 'balanced',
    strategy: 'payment-match',
    advantages: [
      'שומר על ההחזר החודשי הנוכחי (עד 5% מעלה)',
      '⭐ מאפשר מעבר בין בנקים ב"מסלול ירוק" ללא הוכחת הכנסות מחדש',
      ...(mix2Result.degradationStage > 0 ? ['נדרשה הצמדה למדד בחלק מהמסלולים כדי לעמוד בטווח ההחזר'] : []),
    ],
    disadvantages: ['פחות גמיש משינוי תקופה חופשי'],
    recommended_for: '⭐ מומלץ — האפשרות הבטוחה ביותר מול הבנק, ללא חיתום מחדש',
  });

  // ─── Mix 3 — Minimum payment: stretch both new tracks to the max allowed period. ───
  const mix3 = finalizeMix(buildDirectMix(maxAllowedYears, maxAllowedYears), {
    mix_number: 3,
    mix_name: 'תמהיל 3: הקלה תזרימית',
    risk_level: 'aggressive',
    strategy: 'min-payment',
    advantages: ['ההחזר החודשי הנמוך ביותר האפשרי', 'שחרור תזרים מיידי'],
    disadvantages: ['סך התשלומים הכולל לאורך התקופה גבוה משמעותית'],
    recommended_for: 'לקוחות עם בעיית תזרים אמיתית',
  });

  return [mix1, mix2, mix3];
}
