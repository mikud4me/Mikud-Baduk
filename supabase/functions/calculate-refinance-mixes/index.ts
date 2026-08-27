import { json, options } from '../_shared/cors.ts';
import {
  cacheRefinanceMixResult,
  generateRefinanceMixes,
  getCachedRefinanceMixResult,
} from '../_shared/refinance-mixes.js';
import { service } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();

  try {
    const { lead_id: leadId } = await req.json();
    if (!leadId) return json({ error: 'lead_id is required', errorCode: 'LEAD_ID_REQUIRED' }, { status: 400 });

    const { data: lead, error: leadError } = await service
      .from('refinance_leads')
      .select('id, mix_calculation_context, strategy_mix_results, monthly_income')
      .eq('id', leadId)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead) return json({ error: 'Refinance lead was not found', errorCode: 'LEAD_NOT_FOUND' }, { status: 404 });

    const context = lead.mix_calculation_context;
    if (!context?.analysisRevision) {
      return json({
        error: 'The document must be analyzed again before strategy mixes can be calculated',
        errorCode: 'REANALYSIS_REQUIRED',
      }, { status: 409 });
    }

    const cached = getCachedRefinanceMixResult(lead.strategy_mix_results, context.analysisRevision);
    if (cached) {
      return json({ cacheHit: true, mixes: cached.mixes, calculatedAt: cached.calculatedAt });
    }

    // Read fresh from the lead row rather than snapshotting at analysis time —
    // the financial-details step (income) isn't guaranteed to happen before
    // the document analysis, so this needs to reflect whatever's on the lead
    // right now, not what existed when mix_calculation_context was written.
    const mixes = generateRefinanceMixes({ ...context, monthlyIncome: Number(lead.monthly_income) || 0 });
    const calculatedAt = new Date().toISOString();
    const result = { analysisRevision: context.analysisRevision, mixes, calculatedAt };
    const { error: updateError } = await service
      .from('refinance_leads')
      .update({ strategy_mix_results: cacheRefinanceMixResult(result) })
      .eq('id', leadId);
    if (updateError) throw updateError;

    return json({ cacheHit: false, mixes, calculatedAt });
  } catch (error) {
    console.error('calculate-refinance-mixes failed:', error);
    return json({
      error: error instanceof Error ? error.message : 'Mix calculation failed',
      errorCode: 'MIX_CALCULATION_FAILED',
    }, { status: 500 });
  }
});
