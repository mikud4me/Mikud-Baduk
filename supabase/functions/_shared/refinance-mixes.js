const STRATEGY_PERIOD_KEYS = {
  savings: 'savings',
  cashflow: 'cashflow',
};

const TRACK_TYPES = {
  prime: 'פריים',
  fixed: 'קבועה לא צמודה',
  variable: 'משתנה לא צמודה',
};

export function getCachedRefinanceStrategyResult(strategyResults, analysisRevision, strategy) {
  const cached = strategyResults?.[strategy];
  return cached?.analysisRevision === analysisRevision && Array.isArray(cached?.mixes)
    ? cached
    : null;
}

export function cacheRefinanceStrategyResult(strategyResults, strategy, result) {
  return { ...(strategyResults || {}), [strategy]: result };
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

function validateCompliance(tracks) {
  let fixed = 0;
  let variable = 0;

  tracks.forEach((track) => {
    const type = String(track.track_type || '').toLowerCase();
    const percentage = Number(track.percentage) || 0;
    if (type.includes('פריים') || type.includes('prime')) variable += percentage;
    else if (type.includes('קבוע') || type.includes('fixed')) fixed += percentage;
    else if (type.includes('משתנה') || type.includes('variable')) variable += percentage;
  });

  const errors = fixed < 33
    ? [{
        type: 'REGULATORY',
        severity: 'CRITICAL',
        message: `${fixed.toFixed(1)}% קבוע - דורש Auto-Shift`,
        missingPercent: 33.1 - fixed,
      }]
    : [];

  return {
    isCompliant: errors.length === 0,
    fixedPercentage: Math.round(fixed),
    variablePercentage: Math.round(variable),
    errors,
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
  } = context;

  const goldenMonthly = isSurgicalMode
    ? goldenTracks.reduce((sum, track) => sum + annuityPayment(
        Number(track.remaining_balance) || 0,
        Number(track.interest_rate) || 0,
        Number(track.remaining_months) || 0,
      ), 0)
    : 0;

  const calculateMix = (trackDefinitions) => {
    let totalMonthly = 0;
    let totalPayments = 0;
    const calculatedTracks = trackDefinitions.map((definition) => {
      const amount = definition.exact_amount || (mixBasePrincipal * (definition.percentage / 100));
      const months = definition.period_years * 12;
      const monthly = annuityPayment(amount, definition.interest_rate, months);
      totalMonthly += monthly;
      totalPayments += monthly * months;

      return {
        track_type: definition.track_type,
        amount: Math.round(amount),
        percentage: Math.round((amount / mixBasePrincipal) * 1000) / 10,
        interest_rate: definition.interest_rate,
        period_years: definition.period_years,
        monthly_payment: Math.round(monthly),
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
          is_golden: true,
          label: '⭐ מסלול נשמר',
        });
      });
    }

    const mixPeriodMonths = trackDefinitions[0].period_years * 12;
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
      compliance: validateCompliance(calculatedTracks),
    };
  };

  const enforce33Fixed = (mix) => {
    const fixedPercentage = mix.tracks.reduce((sum, track) => (
      String(track.track_type || '').toLowerCase().includes('קבוע')
        ? sum + (Number(track.percentage) || 0)
        : sum
    ), 0);
    if (fixedPercentage >= 33) return mix;

    const missing = 33.1 - fixedPercentage;
    const fixedIndex = mix.tracks.findIndex((track) => String(track.track_type || '').toLowerCase().includes('קבוע'));
    let flexibleIndex = mix.tracks.findIndex((track) => String(track.track_type || '').toLowerCase().includes('פריים'));
    if (flexibleIndex === -1) {
      flexibleIndex = mix.tracks.findIndex((track) => String(track.track_type || '').toLowerCase().includes('משתנה'));
    }
    if (fixedIndex === -1 || flexibleIndex === -1) return mix;

    const newTracks = mix.tracks.map((track, index) => ({
      ...track,
      percentage: index === fixedIndex
        ? track.percentage + missing
        : index === flexibleIndex
          ? Math.max(10, track.percentage - missing)
          : track.percentage,
    }));

    return {
      ...mix,
      ...calculateMix(newTracks),
      mix_name: mix.mix_name,
      mix_number: mix.mix_number,
      risk_level: mix.risk_level,
      advantages: mix.advantages,
      disadvantages: mix.disadvantages,
      recommended_for: mix.recommended_for,
    };
  };

  return { calculateMix, enforce33Fixed };
}

export function generateRefinanceStrategyMixes(context, strategy) {
  if (!Object.hasOwn(STRATEGY_PERIOD_KEYS, strategy)) {
    throw new Error('Invalid refinance mix strategy');
  }

  const periodYears = Number(context.strategyPeriods?.[STRATEGY_PERIOD_KEYS[strategy]]);
  if (!Number.isFinite(periodYears) || periodYears <= 0) {
    throw new Error('The selected strategy period is unavailable');
  }

  const rates = context.marketRates || {};
  const primeRate = Number(rates.prime);
  const fixedRate = Number(rates.fixed_unlinked);
  const variableRate = Number(rates.variable_unlinked);
  if (![primeRate, fixedRate, variableRate].every(Number.isFinite)) {
    throw new Error('The refinance rate snapshot is incomplete');
  }

  const { calculateMix, enforce33Fixed } = buildCalculator(context);
  const definitions = [
    {
      mix_number: 1,
      mix_name: 'תמהיל 1: הגנה מקסימלית',
      risk_level: 'conservative',
      percentages: [27, 46, 27],
      advantages: ['תשלום יציב', 'הגנה מלאה ממדד'],
      disadvantages: ['ריבית גבוהה יותר'],
      recommended_for: 'לקוחות שמעדיפים יציבות מקסימלית',
    },
    {
      mix_number: 2,
      mix_name: 'תמהיל 2: מאוזן',
      risk_level: 'balanced',
      percentages: [33, 34, 33],
      advantages: ['חלוקה מאוזנת', 'תשלום צפוי'],
      disadvantages: ['פחות גמיש'],
      recommended_for: '⭐ מומלץ - איזון אופטימלי',
    },
    {
      mix_number: 3,
      mix_name: 'תמהיל 3: גמישות גבוהה',
      risk_level: 'aggressive',
      percentages: [47, 38, 15],
      advantages: ['גמישות גבוהה', 'ניצול מסלול הפריים'],
      disadvantages: ['חשיפה גבוהה יותר לשינויי ריבית'],
      recommended_for: 'לקוחות שמעדיפים גמישות',
    },
  ];

  return definitions.map((definition) => {
    const [primePercentage, fixedPercentage, variablePercentage] = definition.percentages;
    const calculated = calculateMix([
      { track_type: TRACK_TYPES.prime, percentage: primePercentage, interest_rate: primeRate, period_years: periodYears },
      { track_type: TRACK_TYPES.fixed, percentage: fixedPercentage, interest_rate: fixedRate, period_years: periodYears },
      { track_type: TRACK_TYPES.variable, percentage: variablePercentage, interest_rate: variableRate, period_years: periodYears },
    ]);
    const mix = {
      ...calculated,
      ...definition,
      advantages: [...definition.advantages, `חיסכון: ₪${calculated.monthly_savings.toLocaleString('he-IL')}`],
      strategy,
      strategy_period_years: periodYears,
    };
    delete mix.percentages;
    return enforce33Fixed(mix);
  });
}
