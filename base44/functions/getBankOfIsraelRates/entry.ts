import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOI_INTEREST_URL = "https://www.boi.org.il/PublicApi/GetInterest";

// Cache בזיכרון (מחזיק כל עוד ה-instance חי)
let cache = {
  value: null,
  expiresAt: 0,
};

async function fetchBoiInterest({ timeoutMs = 3000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(BOI_INTEREST_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`BOI GetInterest failed: ${res.status}`);

    const data = await res.json();

    const boiRate = Number(data.currentInterest) / 100;
    if (!Number.isFinite(boiRate)) {
      throw new Error("BOI returned invalid currentInterest");
    }

    const primeBase = boiRate + 0.015;   // + 1.5%
    const primeDiscount = 0.006;          // הנחה ממוצעת ללקוח
    const primeEffective = primeBase - primeDiscount; // פריים אפקטיבי ללקוח

    return {
      boiRate,
      prime: primeBase,
      primeCalc: primeEffective, // זה מה שהלקוח משלם בפועל
      primeEffective,
      primeBase,
      primeDiscount,
      nextBoiUpdate: data.nextInterestDate ?? null,
      source: "boi:GetInterest",
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(t);
  }
}

async function getCachedSnapshot(ttlSeconds) {
  const now = Date.now();
  if (ttlSeconds > 0 && cache.value && now < cache.expiresAt) return cache.value;

  const snap = await fetchBoiInterest();
  if (ttlSeconds > 0) {
    cache.value = snap;
    cache.expiresAt = now + ttlSeconds * 1000;
  }
  return snap;
}

// טבלת ריביות מפורטת - עדכון ינואר 2026
// מקור: אתרי הבנקים הרשמיים + boi.org.il
// פריים בסיסי: 5.5% (בנק ישראל 4% + 1.5%)
// פריים אפקטיבי ללקוח: 4.9% (פריים מינוס 0.6% הנחה)
const MORTGAGE_RATES_CONFIG = {
  last_updated: "2026-01-31",
  market_anchors: {
    prime_rate_base: 0.0550,       // פריים בסיסי
    prime_discount: 0.006,         // הנחה ממוצעת
    prime_effective: 0.0490,       // פריים אפקטיבי ללקוח
  },
  rates_table: [
    {
      path_name: "Prime",
      description: "פריים אפקטיבי (אחרי הנחה 0.6%)",
      rate: 0.0490,
      max_years: 30,
      is_linked: false
    },
    {
      path_name: "Fixed_Linked",
      description: "קבועה צמודה",
      rate: 0.0320,
      max_years: 30,
      is_linked: true
    },
    {
      path_name: "Fixed_Unlinked",
      description: "קבועה לא צמודה (קלצ)",
      rate: 0.0470,
      max_years: 30,
      is_linked: false
    },
    {
      path_name: "Variable_Linked",
      description: "משתנה צמודה כל 5 שנים",
      rate: 0.0315,
      max_years: 30,
      is_linked: true
    },
    {
      path_name: "Variable_Unlinked",
      description: "משתנה לא צמודה כל 5 שנים",
      rate: 0.0458,
      max_years: 30,
      is_linked: false
    }
  ],
  banks: [
    {
      bank_name: "leumi",
      rates: { prime: 0.0490, fixed_linked: 0.0320, fixed_unlinked: 0.0470, variable_linked: 0.0315, variable_unlinked: 0.0458 }
    },
    {
      bank_name: "hapoalim",
      rates: { prime: 0.0490, fixed_linked: 0.0320, fixed_unlinked: 0.0470, variable_linked: 0.0315, variable_unlinked: 0.0458 }
    },
    {
      bank_name: "discount",
      rates: { prime: 0.0490, fixed_linked: 0.0325, fixed_unlinked: 0.0475, variable_linked: 0.0320, variable_unlinked: 0.0460 }
    },
    {
      bank_name: "mizrahi",
      rates: { prime: 0.0490, fixed_linked: 0.0315, fixed_unlinked: 0.0465, variable_linked: 0.0310, variable_unlinked: 0.0455 }
    }
  ]
};

// Fallback rates - ינואר 2026
const FALLBACK_RATES = {
  PRIME:         0.0490, // פריים אפקטיבי (5.5% - 0.6% הנחה)
  PRIME_CALC:    0.0490, // זהה — אפקטיבי ללקוח
  FIXED_UNLINKED: 0.0470,
  VAR_UNLINKED:   0.0458,
  FIXED_LINKED:   0.0320,
  VAR_LINKED:     0.0315
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    void base44;

    const url = new URL(req.url);
    const ttlParam = url.searchParams.get("ttl");
    const ttl = ttlParam === null ? 3600 : Math.max(0, parseInt(ttlParam, 10) || 0);

    const snapshot = await getCachedSnapshot(ttl);

    return Response.json({
      success: true,
      data: snapshot,
      rates: {
        PRIME:          snapshot.primeBase,
        PRIME_CALC:     snapshot.primeEffective, // פריים אפקטיבי ללקוח (אחרי הנחה)
        FIXED_UNLINKED: FALLBACK_RATES.FIXED_UNLINKED,
        VAR_UNLINKED:   FALLBACK_RATES.VAR_UNLINKED,
        FIXED_LINKED:   FALLBACK_RATES.FIXED_LINKED,
        VAR_LINKED:     FALLBACK_RATES.VAR_LINKED
      },
      rates_config: MORTGAGE_RATES_CONFIG,
      bank_of_israel_rate: snapshot.boiRate,
      last_updated: snapshot.fetchedAt,
      prime: snapshot.primeBase,
      prime_effective: snapshot.primeEffective,
      prime_discount: snapshot.primeDiscount
    });
  } catch (error) {
    console.error('BOI API Error:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      rates: {
        PRIME:          FALLBACK_RATES.PRIME,
        PRIME_CALC:     FALLBACK_RATES.PRIME_CALC,
        FIXED_UNLINKED: FALLBACK_RATES.FIXED_UNLINKED,
        VAR_UNLINKED:   FALLBACK_RATES.VAR_UNLINKED,
        FIXED_LINKED:   FALLBACK_RATES.FIXED_LINKED,
        VAR_LINKED:     FALLBACK_RATES.VAR_LINKED
      },
      rates_config: MORTGAGE_RATES_CONFIG,
      bank_of_israel_rate: 0.04,
      last_updated: new Date().toISOString(),
      prime: FALLBACK_RATES.PRIME,
      prime_effective: FALLBACK_RATES.PRIME_CALC,
      prime_discount: 0.006
    });
  }
});