// ─── mortgageUtils.js ────────────────────────────────────────────────────────
// כל הלוגיקה הפיננסית של המשכנתא – נפרדת מה-UI לחלוטין

export const DEFAULT_RATES = {
  FIXED_UNLINKED: 0.0505,
  VAR_UNLINKED:   0.0498,
  FIXED_LINKED:   0.0347,
  VAR_LINKED:     0.0361,
  PRIME:          0.0550,
  PRIME_CALC:     0.0500,
};

export const SENIOR_BANK_MAX_LTV  = 45;
export const SENIOR_BANK_MAX_TERM = 30;
export const BALLOON_MAX_TERM     = 15;

export const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  // ללא פסיקים — רק רווח כמפריד אלפים
  return new Intl.NumberFormat('he-IL', { useGrouping: false }).format(Math.round(val));
};

export const calculatePayment = (principal, rate, years) => {
  if (!principal || !rate || !years || years <= 0) return 0;
  const i = rate / 12;
  const n = years * 12;
  if (i === 0) return principal / n;
  return (principal * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
};

// תיקון: הוסרה הסרת "-" שפגמה במספרי טלפון
export const cleanAiText = (text) => {
  if (!text) return "";
  const lines = text
    .replace(/[*#_]/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  return lines.map((line, i) => `${i + 1}. ${line.replace(/^[0-9]+\.\s*/, '')}`).join('\n\n');
};

export const getReverseMortgageMaxLTV = (age) => {
  const a = Number(age) || 60;
  if (a >= 80) return 50;
  if (a >= 75) return 40;
  if (a >= 70) return 30;
  if (a >= 65) return 25;
  return 20;
};

export const calcTotalIncome = (borrowers) => {
  let total = 0;
  borrowers.forEach((b, idx) => {
    // בן/בת זוג (isSpouse) מוכרים ב-100% כמו הלווה הראשי.
    // לווה נוסף שאינו בן/בת זוג — 50% בלבד.
    const isSpouse = b.isSpouse === true;
    const factor = (idx > 0 && b.borrowerType === 'additional' && !isSpouse) ? 0.5 : 1.0;
    const sources = b.incomeSources || {};
    Object.values(sources).forEach(src => {
      if (src && (src.amount || src.enabled)) {
        total += Number(String(src.amount || '0').replace(/,/g, '')) * factor;
      }
    });
  });
  return total;
};

// חישוב כדאיות מחזור משכנתא
export const calculateRefinanceResults = ({ formData, borrowers, rates }) => {
  const balance = Number(String(formData.refinanceBalance || '0').replace(/,/g, ''));
  const currentMonthly = Number(String(formData.currentMonthlyPayment || '0').replace(/,/g, ''));
  const remainingYears = Number(formData.refinanceRemainingYears || 20);
  const totalInc = calcTotalIncome(borrowers);
  const debts = Number(String(formData.monthlyDebts || '0').replace(/,/g, ''));

  // חישוב ריבית ממוצעת קיימת (לפי יתרה, החזר ותקופה)
  let impliedRate = rates.FIXED_UNLINKED; // ברירת מחדל
  if (balance > 0 && currentMonthly > 0 && remainingYears > 0) {
    // נסיון למצוא ריבית שמסבירה את הנתונים
    const n = remainingYears * 12;
    const p = balance;
    const pmt = currentMonthly;
    // קירוב: r = (pmt/p) * (1 - 1/(1+r)^n) - iterative
    let r = 0.004;
    for (let i = 0; i < 50; i++) {
      const f = p * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1) - pmt;
      const df = p * (Math.pow(1+r,n) * (1 + r*n) - Math.pow(1+r,n) + 1) / Math.pow(Math.pow(1+r,n)-1, 2);
      const rNew = r - f/df;
      if (Math.abs(rNew - r) < 0.0000001) break;
      r = Math.max(0.0001, rNew);
    }
    impliedRate = r * 12;
  }

  // האם הלקוח יכול להגדיל החזר
  const canIncrease = formData.refinanceCanIncreasePayment === 'yes';
  const increaseAmount = canIncrease ? Number(String(formData.refinanceIncreaseAmount || '0').replace(/,/g, '')) : 0;

  const calcPmt = (principal, rate, years) => calculatePayment(principal, rate, years);

  // תרחיש א: אותו החזר חודשי — תקופה קצרה יותר
  // מחשב כמה שנים נחסוך עם תמהיל חדש על אותה תקופה
  const durationSamePayment = remainingYears;
  const mixA_pmt = calcPmt(balance, rates.FIXED_UNLINKED, durationSamePayment);
  const mixA_totalCost = mixA_pmt * durationSamePayment * 12;

  // תרחיש ב (מומלץ): תמהיל מאוזן — אותה תקופה
  const newDuration = remainingYears;
  const mixB_T1_pmt = calcPmt(balance * 0.33, rates.PRIME_CALC, newDuration);
  const mixB_T2_pmt = calcPmt(balance * 0.33, rates.FIXED_UNLINKED, newDuration);
  const mixB_T3_pmt = calcPmt(balance * 0.34, rates.VAR_LINKED, newDuration);
  const mixB_pmt = mixB_T1_pmt + mixB_T2_pmt + mixB_T3_pmt;
  const mixB_totalCost = mixB_pmt * newDuration * 12;

  // תרחיש ג: הגדלת החזר (אם רלוונטי) — מקצר תקופה
  // מחשב תקופה קצרה יותר עם ההחזר המוגדל
  let mixC_duration = newDuration;
  let mixC_pmt_monthly = calcPmt(balance * 0.5, rates.PRIME_CALC, newDuration) + calcPmt(balance * 0.5, rates.FIXED_UNLINKED, newDuration);
  if (canIncrease && increaseAmount > 0) {
    const targetPmt = mixB_pmt + increaseAmount;
    // מחשב תקופה שמתאימה להחזר המוגדל (קירוב)
    const r = rates.FIXED_UNLINKED / 12;
    if (r > 0 && targetPmt > balance * r) {
      mixC_duration = Math.ceil(Math.log(targetPmt / (targetPmt - balance * r)) / Math.log(1 + r) / 12);
      mixC_duration = Math.max(1, Math.min(mixC_duration, newDuration));
    }
    const mixC_T1_pmt = calcPmt(balance * 0.5, rates.PRIME_CALC, mixC_duration);
    const mixC_T2_pmt = calcPmt(balance * 0.5, rates.FIXED_UNLINKED, mixC_duration);
    mixC_pmt_monthly = mixC_T1_pmt + mixC_T2_pmt;
  }
  const mixC_totalCost = mixC_pmt_monthly * mixC_duration * 12;

  // חיסכון בהשוואה לעלות נוכחית
  const totalCurrentCost = currentMonthly * remainingYears * 12;
  const monthlySaving = currentMonthly - mixB_pmt;
  const totalSaving = totalCurrentCost - mixB_totalCost;

  // break-even: עלות פתיחת תיק ~5000 שח
  const breakEvenMonths = monthlySaving > 0 ? Math.ceil(5000 / monthlySaving) : null;

  const freeIncome = Math.max(1, totalInc - debts);
  const dti = (mixB_pmt / freeIncome) * 100;
  const isWorthwhile = totalSaving > 5000 && monthlySaving > 0;

  return {
    balance,
    currentMonthly,
    remainingYears,
    impliedRate: impliedRate * 100,
    monthlySaving: Math.floor(monthlySaving),
    totalSaving: Math.floor(totalSaving),
    breakEvenMonths,
    isWorthwhile,
    dti,
    totalIncome: totalInc,
    canIncrease,
    increaseAmount,
    mixC_duration,
    score: Math.min(100, Math.max(0, isWorthwhile ? 80 + Math.min(20, totalSaving / 10000) : 40)),
    // תרחיש א: קבועה לא צמודה — הגנה מלאה, אותה תקופה
    mixA: {
      label: 'תרחיש א׳ — הגנה מלאה',
      subtitle: `אותה תקופה (${remainingYears} שנים) — ריבית קבועה`,
      tracks: [{ name: "100% קבועה לא צמודה", amount: balance, rate: rates.FIXED_UNLINKED, years: durationSamePayment, pmt: mixA_pmt, desc: "הגנה מלאה" }],
      total: mixA_pmt,
      totalCost: mixA_totalCost,
      saving: totalCurrentCost - mixA_totalCost,
    },
    // תרחיש ב (מומלץ): תמהיל מאוזן
    mixB: {
      label: 'תרחיש ב׳ — תמהיל מאוזן (מומלץ)',
      subtitle: `אותה תקופה — חיסכון מקסימלי בריבית`,
      tracks: [
        { name: "פריים (Prime)", amount: balance * 0.33, rate: rates.PRIME_CALC, years: newDuration, pmt: mixB_T1_pmt, desc: "P-0.5%" },
        { name: "קבועה לא צמודה", amount: balance * 0.33, rate: rates.FIXED_UNLINKED, years: newDuration, pmt: mixB_T2_pmt, desc: "החזר קבוע" },
        { name: "משתנה כל 5 שנים צמודה", amount: balance * 0.34, rate: rates.VAR_LINKED, years: newDuration, pmt: mixB_T3_pmt, desc: "משתנה צמודה" },
      ],
      total: mixB_pmt,
      totalCost: mixB_totalCost,
      saving: totalCurrentCost - mixB_totalCost,
    },
    // תרחיש ג: הגדלת החזר / פריים+קבועה
    mixC: {
      label: canIncrease && increaseAmount > 0
        ? `תרחיש ג׳ — הגדלת ₪${increaseAmount} לחודש`
        : `תרחיש ג׳ — פריים + קבועה`,
      subtitle: canIncrease && increaseAmount > 0
        ? `קיצור תקופה ל-${mixC_duration} שנים — חיסכון ריבית מקסימלי`
        : `50% פריים + 50% קבועה — גמישות`,
      tracks: canIncrease && increaseAmount > 0
        ? [
            { name: "50% פריים (תקופה מקוצרת)", amount: balance * 0.5, rate: rates.PRIME_CALC, years: mixC_duration, pmt: calcPmt(balance * 0.5, rates.PRIME_CALC, mixC_duration), desc: `${mixC_duration} שנים` },
            { name: "50% קבועה לא צמודה", amount: balance * 0.5, rate: rates.FIXED_UNLINKED, years: mixC_duration, pmt: calcPmt(balance * 0.5, rates.FIXED_UNLINKED, mixC_duration), desc: `${mixC_duration} שנים` },
          ]
        : [
            { name: "50% פריים", amount: balance * 0.5, rate: rates.PRIME_CALC, years: newDuration, pmt: calcPmt(balance * 0.5, rates.PRIME_CALC, newDuration), desc: "גמישות" },
            { name: "50% קבועה לא צמודה", amount: balance * 0.5, rate: rates.FIXED_UNLINKED, years: newDuration, pmt: calcPmt(balance * 0.5, rates.FIXED_UNLINKED, newDuration), desc: "יציבות" },
          ],
      total: mixC_pmt_monthly,
      totalCost: mixC_totalCost,
      saving: totalCurrentCost - mixC_totalCost,
    },
    actualDuration: newDuration,
  };
};

export const calculateResults = ({ formData, borrowers, maxTerm, rates, ALL_PURPOSE_RATES }) => {
  const price         = Number(String(formData.propertyPrice).replace(/,/g, '')) || 0;
  const eq            = Number(String(formData.equity).replace(/,/g, '')) || 0;
  const duration      = Math.min(maxTerm, Number(formData.loanDuration) || maxTerm);
  const requestedLoan = Number(String(formData.loanAmount || '').replace(/,/g, '')) || 0;
  const loanAmount    = requestedLoan > 0 ? requestedLoan : Math.max(0, price - eq);
  const ltv           = price > 0 ? (loanAmount / price) : 0;
  const totalInc      = calcTotalIncome(borrowers);
  const debts         = Number(String(formData.monthlyDebts).replace(/,/g, '')) || 0;
  const freeIncome    = Math.max(1, totalInc - debts);
  const isReverse     = formData.mortgageType === 'reverse_mortgage';
  const isSenior      = formData.mortgageType === 'senior_bank';
  const isBalloon     = formData.seniorBalloon === true;

  const activeRates = isSenior ? ALL_PURPOSE_RATES : rates;

  const calcPmt = (principal, rate, years) => {
    if (isSenior && isBalloon) return principal * rate / 12;
    return calculatePayment(principal, rate, years);
  };

  const mixB_T1 = {
    name: "פריים (Prime)",
    amount: loanAmount * 0.33,
    rate: activeRates.PRIME_CALC,
    years: duration,
    pmt: calcPmt(loanAmount * 0.33, activeRates.PRIME_CALC, duration),
    desc: isSenior && isBalloon ? "ריבית בלבד" : "P-0.5%",
  };
  const mixB_T2 = {
    name: "קבועה לא צמודה (קל\"צ)",
    amount: loanAmount * 0.33,
    rate: activeRates.FIXED_UNLINKED,
    years: duration,
    pmt: calcPmt(loanAmount * 0.33, activeRates.FIXED_UNLINKED, duration),
    desc: isSenior && isBalloon ? "ריבית בלבד" : "החזר קבוע",
  };
  const mixB_T3 = {
    name: "משתנה כל 5 שנים צמודה",
    amount: loanAmount * 0.34,
    rate: activeRates.VAR_LINKED,
    years: duration,
    pmt: calcPmt(loanAmount * 0.34, activeRates.VAR_LINKED, duration),
    desc: isSenior && isBalloon ? "ריבית בלבד" : "משתנה צמודה",
  };
  const pmtB = mixB_T1.pmt + mixB_T2.pmt + mixB_T3.pmt;

  const balloonInterestOnly = isSenior && isBalloon ? loanAmount * activeRates.FIXED_UNLINKED / 12 : null;
  const dtiBase  = isSenior && isBalloon ? balloonInterestOnly : pmtB;
  const dti      = (isReverse || isSenior) ? 0 : (dtiBase / freeIncome) * 100;
  const ltvPercent  = ltv * 100;
  const youngestAge = Number(formData.youngestBorrowerAge) || Number(formData.age) || 60;
  const maxReverseLTV = isReverse ? getReverseMortgageMaxLTV(youngestAge) : 75;

  let status = {
    color: 'green',
    text: isReverse ? 'כשיר למשכנתא לגיל הזהב' : isSenior ? 'כשיר - משכנתא בנקאית לגיל הזהב' : 'כשיר להגשה לבנק',
    subtitle: isReverse ? `אחוז מימון מקסימלי לגילך: ${maxReverseLTV}%` : isSenior ? `מקסימום ${SENIOR_BANK_MAX_LTV}% מימון | עד 30 שנה | ללא ביטוח חיים חובה` : 'התיק עומד בתקני בנק ישראל',
    action: null,
    icon: 'check',
  };

  if (isReverse) {
    if (ltvPercent > maxReverseLTV) {
      const excessLoan = loanAmount - (price * maxReverseLTV / 100);
      status = { color: 'red', text: 'דורש התאמה', subtitle: `אחוז מימון ${ltvPercent.toFixed(1)}% חורג מהמותר לגילך`, action: `יש להקטין את הסכום המבוקש ב-₪${formatCurrency(Math.floor(excessLoan))} (מקסימום ${maxReverseLTV}% מימון בגיל ${youngestAge}).`, icon: 'alert' };
    }
  } else if (isSenior) {
    if (ltvPercent > SENIOR_BANK_MAX_LTV) {
      const excessLoan = loanAmount - (price * SENIOR_BANK_MAX_LTV / 100);
      status = { color: 'red', text: 'דורש התאמה', subtitle: `אחוז מימון ${ltvPercent.toFixed(1)}% חורג מהמותר (מקסימום ${SENIOR_BANK_MAX_LTV}%)`, action: `יש להקטין את הסכום המבוקש ב-₪${formatCurrency(Math.floor(excessLoan))} להורדת המימון ל-${SENIOR_BANK_MAX_LTV}%.`, icon: 'alert' };
    }
  } else {
    if (dti > 45) {
      const excessPayment = pmtB - (freeIncome * 0.40);
      status = { color: 'red', text: 'דורש התאמת נתונים', subtitle: `יחס החזר ${dti.toFixed(1)}% חורג מהמותר`, action: `יש להקטין את ההחזר החודשי ב-₪${formatCurrency(Math.floor(excessPayment))} או להגדיל הכנסות.`, icon: 'alert' };
    } else if (ltvPercent > 75) {
      const excessLoan = loanAmount - (price * 0.75);
      status = { color: 'red', text: 'דורש התאמת נתונים', subtitle: `אחוז מימון ${ltvPercent.toFixed(1)}% חורג מהמותר`, action: `נדרש הון עצמי נוסף של ₪${formatCurrency(Math.floor(excessLoan))} להורדת אחוז המימון ל-75%.`, icon: 'alert' };
    } else if (dti > 40) {
      status = { color: 'yellow', text: 'דורש אישור מיוחד', subtitle: `יחס החזר ${dti.toFixed(1)}% גבולי`, action: 'מומלץ להאריך תקופת הלוואה, לצמצם הלוואות קיימות, או להגדיל הכנסות.', icon: 'warning' };
    } else if (dti > 35) {
      status = { color: 'yellow', text: 'כשיר עם המלצה לשיפור', subtitle: `יחס החזר ${dti.toFixed(1)}% טוב`, action: 'תיק תקין. ניתן לשפר ע"י הארכת תקופה או תמהיל אסטרטגי לחיסכון בריבית.', icon: 'info' };
    }
  }

  const qualityScore = isReverse
    ? Math.min(100, Math.max(0, 100 - (ltvPercent > maxReverseLTV ? (ltvPercent - maxReverseLTV) * 3 : 0)))
    : isSenior
      ? Math.min(100, Math.max(0, 100 - (ltvPercent > SENIOR_BANK_MAX_LTV ? (ltvPercent - SENIOR_BANK_MAX_LTV) * 3 : 0)))
      : Math.min(100, Math.max(0, 100 - (dti > 35 ? (dti - 35) * 4 : 0) - (ltvPercent > 70 ? (ltvPercent - 70) * 2 : 0)));

  const balloonMonthly = isSenior && isBalloon ? loanAmount * activeRates.FIXED_UNLINKED / 12 : null;
  const regularMonthly = isSenior ? calculatePayment(loanAmount, activeRates.FIXED_UNLINKED, duration) : null;

  return {
    loanAmount, ltv: ltvPercent, totalIncome: totalInc, dti, actualDuration: duration,
    status, score: qualityScore, isReverse, isSenior, isBalloon,
    balloonMonthly, regularMonthly,
    mixA: {
      tracks: [{ name: isSenior ? "100% קבועה לא צמודה (כל מטרה)" : "100% קבועה לא צמודה", amount: loanAmount, rate: activeRates.FIXED_UNLINKED, years: duration, pmt: calcPmt(loanAmount, activeRates.FIXED_UNLINKED, duration), desc: isSenior && isBalloon ? "⚠️ בלון - ריבית בלבד" : "הגנה מלאה" }],
      total: calcPmt(loanAmount, activeRates.FIXED_UNLINKED, duration),
    },
    mixB: { tracks: [mixB_T1, mixB_T2, mixB_T3], total: pmtB },
    mixC: {
      tracks: [
        { name: "50% פריים (Prime)", amount: loanAmount * 0.5, rate: activeRates.PRIME_CALC, years: duration, pmt: calcPmt(loanAmount * 0.5, activeRates.PRIME_CALC, duration), desc: isSenior && isBalloon ? "ריבית בלבד" : "ניצול שוק" },
        { name: isSenior ? "50% קבועה (כל מטרה)" : "50% קבועה (קל\"צ)", amount: loanAmount * 0.5, rate: activeRates.FIXED_UNLINKED, years: duration, pmt: calcPmt(loanAmount * 0.5, activeRates.FIXED_UNLINKED, duration), desc: isSenior && isBalloon ? "ריבית בלבד" : "עוגן יציבות" },
      ],
      total: calcPmt(loanAmount * 0.5, activeRates.PRIME_CALC, duration) + calcPmt(loanAmount * 0.5, activeRates.FIXED_UNLINKED, duration),
    },
  };
};