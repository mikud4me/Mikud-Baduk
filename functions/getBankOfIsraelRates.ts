import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOI_INTEREST_URL = "https://www.boi.org.il/PublicApi/GetInterest";

// Cache בזיכרון (מחזיק כל עוד ה-instance חי)
let cache = {
  value: null,
  expiresAt: 0,
};

async function fetchBoiInterest({ timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(BOI_INTEREST_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`BOI GetInterest failed: ${res.status}`);

    const data = await res.json();

    const boiRate = Number(data.currentInterest) / 100; // המרה לפורמט עשרוני
    if (!Number.isFinite(boiRate)) {
      throw new Error("BOI returned invalid currentInterest");
    }

    const prime = boiRate + 0.015; // + 1.5%
    const primeCalc = prime - 0.005; // P-0.5%

    return {
      boiRate,
      prime,
      primeCalc,
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

// Fallback rates (אם ה-API נכשל)
const FALLBACK_RATES = {
  FIXED_UNLINKED: 0.0505,
  VAR_UNLINKED: 0.0498,
  FIXED_LINKED: 0.0347,
  VAR_LINKED: 0.0361
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
        PRIME: snapshot.prime,
        PRIME_CALC: snapshot.primeCalc,
        FIXED_UNLINKED: FALLBACK_RATES.FIXED_UNLINKED,
        VAR_UNLINKED: FALLBACK_RATES.VAR_UNLINKED,
        FIXED_LINKED: FALLBACK_RATES.FIXED_LINKED,
        VAR_LINKED: FALLBACK_RATES.VAR_LINKED
      },
      bank_of_israel_rate: snapshot.boiRate,
      last_updated: snapshot.fetchedAt
    });
  } catch (error) {
    console.error('BOI API Error:', error);
    
    // Fallback: ריבית בנק ישראל 4.5% + 1.5% = 6% פריים
    const fallbackBankRate = 0.045;
    const fallbackPrime = fallbackBankRate + 0.015;
    const fallbackPrimeCalc = fallbackPrime - 0.005;

    return Response.json({
      success: false,
      error: error.message,
      rates: {
        PRIME: fallbackPrime,
        PRIME_CALC: fallbackPrimeCalc,
        FIXED_UNLINKED: FALLBACK_RATES.FIXED_UNLINKED,
        VAR_UNLINKED: FALLBACK_RATES.VAR_UNLINKED,
        FIXED_LINKED: FALLBACK_RATES.FIXED_LINKED,
        VAR_LINKED: FALLBACK_RATES.VAR_LINKED
      },
      bank_of_israel_rate: fallbackBankRate,
      last_updated: new Date().toISOString()
    });
  }
});