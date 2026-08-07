import { json, options } from '../_shared/cors.ts';

const fallbackRates = { PRIME: 0.049, PRIME_CALC: 0.049, FIXED_UNLINKED: 0.047, VAR_UNLINKED: 0.0458, FIXED_LINKED: 0.032, VAR_LINKED: 0.0315 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const response = await fetch('https://www.boi.org.il/PublicApi/GetInterest', { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`Bank of Israel returned ${response.status}`);
    const data = await response.json();
    const boiRate = Number(data.currentInterest) / 100;
    if (!Number.isFinite(boiRate)) throw new Error('Invalid Bank of Israel rate');
    const primeBase = boiRate + 0.015;
    const primeEffective = primeBase - 0.006;
    return json({ success: true, data: { boiRate, prime: primeBase, primeEffective, primeBase, primeDiscount: 0.006, nextBoiUpdate: data.nextInterestDate ?? null, fetchedAt: new Date().toISOString() }, rates: { ...fallbackRates, PRIME: primeBase, PRIME_CALC: primeEffective }, bank_of_israel_rate: boiRate, last_updated: new Date().toISOString(), prime: primeBase, prime_effective: primeEffective, prime_discount: 0.006 });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : 'Rate unavailable', rates: fallbackRates, bank_of_israel_rate: 0.04, last_updated: new Date().toISOString(), prime: fallbackRates.PRIME, prime_effective: fallbackRates.PRIME_CALC, prime_discount: 0.006 });
  }
});
