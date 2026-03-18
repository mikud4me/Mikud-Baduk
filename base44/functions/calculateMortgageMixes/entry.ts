import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PMT – החזר חודשי ראשוני
 */
function calculateMonthlyPayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    return Number((principal / months).toFixed(2));
  }

  const payment =
    (principal * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -months));

  return Number(payment.toFixed(2));
}

/**
 * ריביות ייעוציות (לא דינמיות)
 * ⚠️ בכוונה – רק פריים נמשך דינמית
 */
const ADVISORY_RATES = {
  kalatz: 0.0478,               // קל"צ ממוצע שוק
  variable_unlinked: 0.0492     // משתנה לא צמודה ממוצעת
};

/**
 * בניית תמהילים (mixA / mixB / mixC)
 */
function buildMixes({ loanAmount, years, primeRate }) {
  const pmt = (amount, rate) =>
    calculateMonthlyPayment(amount, rate, years);

  const mixA = {
    label: "זול היום",
    risk: "גבוה",
    monthlyPayment: Number((
      pmt(loanAmount * 0.66, primeRate) +
      pmt(loanAmount * 0.34, ADVISORY_RATES.variable_unlinked)
    ).toFixed(2)),
    tracks: [
      { track: "prime", percent: 66, rate: primeRate },
      { track: "variable_unlinked", percent: 34, rate: ADVISORY_RATES.variable_unlinked }
    ]
  };

  const mixB = {
    label: "מאוזן",
    risk: "בינוני",
    monthlyPayment: Number((
      pmt(loanAmount * 0.33, primeRate) +
      pmt(loanAmount * 0.34, ADVISORY_RATES.kalatz) +
      pmt(loanAmount * 0.33, ADVISORY_RATES.variable_unlinked)
    ).toFixed(2)),
    tracks: [
      { track: "prime", percent: 33, rate: primeRate },
      { track: "kalatz", percent: 34, rate: ADVISORY_RATES.kalatz },
      { track: "variable_unlinked", percent: 33, rate: ADVISORY_RATES.variable_unlinked }
    ]
  };

  const mixC = {
    label: "סולידי",
    risk: "נמוך",
    monthlyPayment: Number((
      pmt(loanAmount * 0.7, ADVISORY_RATES.kalatz) +
      pmt(loanAmount * 0.3, primeRate)
    ).toFixed(2)),
    tracks: [
      { track: "kalatz", percent: 70, rate: ADVISORY_RATES.kalatz },
      { track: "prime", percent: 30, rate: primeRate }
    ]
  };

  return { mixA, mixB, mixC };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const url = new URL(req.url);
    const loanAmount = Number(url.searchParams.get("loan") ?? 800000);
    const years = Number(url.searchParams.get("years") ?? 20);

    if (!loanAmount || !years) {
      return Response.json({ error: "חובה לספק loan ו-years" }, { status: 400 });
    }

    // 🔗 קריאה לפונקציה הקיימת
    const ratesResponse = await base44.functions.invoke('getBankOfIsraelRates');
    const primeRate = ratesResponse?.data?.prime;

    if (!primeRate) {
      return Response.json({ error: "לא התקבלה ריבית פריים מ־getBankOfIsraelRates" }, { status: 500 });
    }

    const mixes = buildMixes({ loanAmount, years, primeRate });

    // מי הזול היום?
    const cheapest = Object.entries(mixes)
      .sort((a, b) => a[1].monthlyPayment - b[1].monthlyPayment)[0][0];

    return Response.json({
      success: true,
      data: {
        loanAmount,
        years,
        primeRate,
        advisoryRates: ADVISORY_RATES,
        mixes,
        cheapestMix: cheapest,
        disclaimer:
          "החישוב מציג החזר חודשי ראשוני בלבד. הריביות לקל\"צ ולמשתנה הן ריביות ייעוציות ממוצעות, לא הצעת בנק מחייבת."
      }
    });

  } catch (error) {
    console.error('Calculate Mortgage Mixes Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});