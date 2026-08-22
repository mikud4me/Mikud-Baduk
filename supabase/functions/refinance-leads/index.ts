import { json, options } from '../_shared/cors.ts';
import { service } from '../_shared/supabase.ts';

const columns: Record<string, string> = {
  full_name: 'full_name', id_number: 'id_number', email: 'email', phone: 'phone', tier: 'tier', status: 'status', file_url: 'file_url',
  analysis_result: 'analysis_result', has_extra_debts: 'has_extra_debts', external_debts: 'external_debts', analyzed_at: 'analyzed_at',
  monthly_income: 'monthly_income', property_purchase_price: 'property_purchase_price', estimated_current_property_value: 'estimated_current_property_value',
  contact_consent: 'contact_consent', terms_accepted: 'terms_accepted', terms_accepted_at: 'terms_accepted_at',
  mix_calculation_context: 'mix_calculation_context', strategy_mix_results: 'strategy_mix_results',
};

function toRow(payload: Record<string, unknown>) {
  const row: Record<string, unknown> = { payload };
  for (const key of Object.keys(columns)) if (payload[key] !== undefined) row[columns[key]] = payload[key];
  return row;
}
function toClient(row: Record<string, any>) {
  const client = { ...(row.payload || {}), ...row };
  const analysisRevision = row.mix_calculation_context?.analysisRevision;
  client.has_mix_calculation_context = Boolean(analysisRevision);
  client.has_cached_mixes = Boolean(
    row.strategy_mix_results?.analysisRevision === analysisRevision
    && Array.isArray(row.strategy_mix_results?.mixes),
  );
  if (client.payload) {
    client.payload = { ...client.payload };
    delete client.payload.mix_calculation_context;
    delete client.payload.strategy_mix_results;
  }
  delete client.mix_calculation_context;
  delete client.strategy_mix_results;
  return client;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { action, id, payload } = await req.json();
    if (action === 'create') {
      const { data, error } = await service.from('refinance_leads').insert(toRow(payload || {})).select().single();
      if (error) throw error;
      return json(toClient(data));
    }
    if (!id) return json({ error: 'id is required' }, { status: 400 });
    if (action === 'get') {
      const { data, error } = await service.from('refinance_leads').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return json(data ? toClient(data) : null);
    }
    if (action === 'update') {
      const { data, error } = await service.from('refinance_leads').update(toRow(payload || {})).eq('id', id).select().single();
      if (error) throw error;
      return json(toClient(data));
    }
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 500 }); }
});
