import { json, options } from '../_shared/cors.ts';
import {
  cacheRefinanceStrategyResult,
  generateRefinanceStrategyMixes,
  getCachedRefinanceStrategyResult,
} from '../_shared/refinance-mixes.js';
import { service } from '../_shared/supabase.ts';

const VALID_STRATEGIES = new Set(['savings', 'cashflow']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();

  try {
    const { lead_id: leadId, strategy } = await req.json();
    if (!leadId) return json({ error: 'lead_id is required', errorCode: 'LEAD_ID_REQUIRED' }, { status: 400 });
    if (!VALID_STRATEGIES.has(strategy)) {
      return json({ error: 'Invalid strategy', errorCode: 'INVALID_STRATEGY' }, { status: 400 });
    }

    const { data: lead, error: leadError } = await service
      .from('refinance_leads')
      .select('id, mix_calculation_context, strategy_mix_results')
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

    const cached = getCachedRefinanceStrategyResult(
      lead.strategy_mix_results,
      context.analysisRevision,
      strategy,
    );
    if (cached) {
      const { error: selectError } = await service
        .from('refinance_leads')
        .update({ selected_mix_strategy: strategy })
        .eq('id', leadId);
      if (selectError) throw selectError;
      return json({
        strategy,
        cacheHit: true,
        recommendedMixId: cached.recommendedMixId || 2,
        mixes: cached.mixes,
        calculatedAt: cached.calculatedAt,
      });
    }

    const mixes = generateRefinanceStrategyMixes(context, strategy);
    const calculatedAt = new Date().toISOString();
    const result = {
      analysisRevision: context.analysisRevision,
      strategy,
      recommendedMixId: 2,
      mixes,
      calculatedAt,
    };
    const strategyResults = cacheRefinanceStrategyResult(lead.strategy_mix_results, strategy, result);
    const { error: updateError } = await service
      .from('refinance_leads')
      .update({ strategy_mix_results: strategyResults, selected_mix_strategy: strategy })
      .eq('id', leadId);
    if (updateError) throw updateError;

    return json({ strategy, cacheHit: false, recommendedMixId: 2, mixes, calculatedAt });
  } catch (error) {
    console.error('calculate-refinance-mixes failed:', error);
    return json({
      error: error instanceof Error ? error.message : 'Mix calculation failed',
      errorCode: 'MIX_CALCULATION_FAILED',
    }, { status: 500 });
  }
});
