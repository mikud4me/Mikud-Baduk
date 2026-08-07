/*
 * Imports a JSON export created before the cutover, or the three Base44 CSV
 * exports in a directory. Unrecognized Lead fields are retained in `payload`,
 * while source IDs are preserved.
 */
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const [inputPath] = process.argv.slice(2);
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!inputPath || !url || !serviceKey) throw new Error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-base44-export.mjs export.json|export-directory');

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else value += char;
  }
  row.push(value);
  if (row.some((cell) => cell !== '')) rows.push(row);
  const [headers = [], ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])));
}

async function loadSource(path) {
  if (extname(path).toLowerCase() === '.json') return JSON.parse(await readFile(path, 'utf8'));
  const [leads, mortgageMixes, emailVerifications] = await Promise.all([
    readFile(join(path, 'Lead_export.csv'), 'utf8').then(parseCsv),
    readFile(join(path, 'MortgageMix_export.csv'), 'utf8').then(parseCsv),
    readFile(join(path, 'EmailVerification_export.csv'), 'utf8').then(parseCsv),
  ]);
  return { leads, mortgageMixes, emailVerifications };
}

const source = await loadSource(inputPath);
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const bool = (value) => value === true || value === 1 || String(value).toLowerCase() === 'true';
const number = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const mapLead = (lead) => ({
  base44_legacy_id: lead.id,
  full_name: lead.fullName,
  id_number: lead.idNumber,
  birth_date: lead.birthDate || null,
  age: number(lead.age),
  phone: lead.phone,
  email: lead.email,
  email_verified: bool(lead.emailVerified),
  marital_status: lead.maritalStatus,
  children_under_18: number(lead.childrenUnder18),
  purpose: lead.purpose,
  mortgage_type: lead.mortgageType,
  property_price: number(lead.propertyPrice),
  equity: number(lead.equity),
  net_income: number(lead.netIncome),
  monthly_debts: number(lead.monthlyDebts),
  monthly_overdraft: number(lead.monthlyOverdraft),
  loan_duration: number(lead.loanDuration),
  loan_amount: number(lead.loanAmount),
  ltv: number(lead.ltv),
  score: number(lead.score),
  ai_analysis: lead.aiAnalysis,
  is_purchased: bool(lead.isPurchased),
  status: lead.status || 'new',
  payload: lead,
  created_at: lead.created_date || lead.createdAt || new Date().toISOString(),
  updated_at: lead.updated_date || lead.updatedAt || new Date().toISOString(),
});

const rows = (source.leads || source.Lead || []).filter((lead) => lead.id).map(mapLead);
for (let offset = 0; offset < rows.length; offset += 100) {
  const { error } = await supabase.from('mortgage_leads').upsert(rows.slice(offset, offset + 100), { onConflict: 'base44_legacy_id' });
  if (error) throw error;
}

const mixes = (source.mortgageMixes || source.MortgageMix || []).map((mix) => ({
  base44_legacy_id: mix.id,
  name: mix.name,
  total_amount: number(mix.total_amount),
  loan_period_years: number(mix.loan_period_years),
  tracks: mix.tracks || [],
  monthly_payment: number(mix.monthly_payment),
  total_interest: number(mix.total_interest),
  total_payment: number(mix.total_payment),
  risk_level: mix.risk_level,
  notes: mix.notes,
})).filter((mix) => mix.base44_legacy_id);
if (mixes.length) {
  const { error } = await supabase.from('mortgage_mixes').upsert(mixes, { onConflict: 'base44_legacy_id' });
  if (error) throw error;
}

const verifications = (source.emailVerifications || source.EmailVerification || []).map((item) => ({
  base44_legacy_id: item.id,
  email: item.email,
  code_hash: item.codeHash,
  expires_at: item.expiresAt,
  attempts: number(item.attempts) || 0,
  verified: bool(item.verified),
  last_sent_at: item.lastSentAt || item.created_date || new Date().toISOString(),
  created_at: item.created_date || new Date().toISOString(),
})).filter((item) => item.email && item.code_hash && item.expires_at);
if (verifications.length) {
  const { error } = await supabase.from('email_verifications').upsert(verifications, { onConflict: 'base44_legacy_id' });
  if (error) throw error;
}

console.log(JSON.stringify({ importedLeads: rows.length, importedMortgageMixes: mixes.length, importedEmailVerifications: verifications.length }));
