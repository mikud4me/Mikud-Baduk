import { json, options } from '../_shared/cors.ts';
import { isAdminRequest, service } from '../_shared/supabase.ts';

const columns: Record<string, string> = {
  fullName: 'full_name', idNumber: 'id_number', birthDate: 'birth_date', age: 'age', phone: 'phone', email: 'email',
  emailVerified: 'email_verified', maritalStatus: 'marital_status', childrenUnder18: 'children_under_18', purpose: 'purpose',
  mortgageType: 'mortgage_type', propertyPrice: 'property_price', equity: 'equity', netIncome: 'net_income',
  monthlyDebts: 'monthly_debts', monthlyOverdraft: 'monthly_overdraft', loanDuration: 'loan_duration', loanAmount: 'loan_amount',
  ltv: 'ltv', score: 'score', aiAnalysis: 'ai_analysis', isPurchased: 'is_purchased', status: 'status',
};

function databasePayload(payload: Record<string, unknown>) {
  const row: Record<string, unknown> = { payload };
  for (const [camel, snake] of Object.entries(columns)) if (payload[camel] !== undefined) row[snake] = payload[camel];
  return row;
}

function clientPayload(row: Record<string, any>) {
  const lead: Record<string, unknown> = { ...(row.payload || {}), id: row.id, created_date: row.created_at, updated_date: row.updated_at };
  for (const [camel, snake] of Object.entries(columns)) if (row[snake] !== null && row[snake] !== undefined) lead[camel] = row[snake];
  return lead;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const { action, id, payload, limit = 100 } = await req.json();
    if (action === 'create') {
      const { data, error } = await service.from('mortgage_leads').insert(databasePayload(payload || {})).select().single();
      if (error) throw error;
      return json(clientPayload(data));
    }
    if (action === 'update') {
      if (!id) return json({ error: 'id is required' }, { status: 400 });
      const { data, error } = await service.from('mortgage_leads').update(databasePayload(payload || {})).eq('id', id).select().single();
      if (error) throw error;
      return json(clientPayload(data));
    }
    if (!(await isAdminRequest(req))) return json({ error: 'Administrator access required' }, { status: 403 });
    if (action === 'get') {
      const { data, error } = await service.from('mortgage_leads').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return json(data ? clientPayload(data) : null);
    }
    if (action === 'list') {
      const { data, error } = await service.from('mortgage_leads').select('*').order('created_at', { ascending: false }).limit(Math.min(Number(limit) || 100, 500));
      if (error) throw error;
      return json((data || []).map(clientPayload));
    }
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('mortgage-leads', error);
    return json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 500 });
  }
});
