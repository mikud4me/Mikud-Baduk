const CARDCOM_CREATE_URL = 'https://secure.cardcom.solutions/api/v11/LowProfile/Create';
export const CARDCOM_RESULT_URL = 'https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult';

// Keep the test-terminal amount aligned with the existing production payment
// functions. The customer-facing price is controlled separately in the UI.
export const CARDCOM_AMOUNT = 1;
const PRODUCT_NAME = 'דוח תמהיל משכנתא — מיקוד משכנתאות';
const ALLOWED_REDIRECT_HOSTS = ['mikud4me.co.il', 'www.mikud4me.co.il'];

type LeadType = 'mortgage' | 'refinance';

function supabaseConfig() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('Supabase payment configuration is missing');
  return { url, serviceRoleKey };
}

function refinanceUrl(path: string, leadId: string) {
  const { url } = supabaseConfig();
  const endpoint = new URL(path, url);
  endpoint.searchParams.set('id', `eq.${leadId}`);
  return endpoint;
}

function supabaseHeaders(serviceRoleKey: string, extra: Record<string, string> = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra,
  };
}

export function isAllowedOrigin(url: unknown) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return ALLOWED_REDIRECT_HOSTS.includes(parsed.hostname) || parsed.hostname.endsWith('.base44.app');
    }
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

export function normalizeLeadType(leadType: unknown): LeadType | null {
  return leadType === 'mortgage' || leadType === 'refinance' ? leadType : null;
}

export function paymentReturnValue(leadType: LeadType, leadId: string) {
  return `${leadType}:${leadId}`;
}

export function parsePaymentReturnValue(value: unknown): { leadType: LeadType; leadId: string } | null {
  if (typeof value !== 'string') return null;
  const separator = value.indexOf(':');
  // Preserve verification for already-opened legacy mortgage checkouts while
  // all newly created sessions use the explicit, type-bound format above.
  if (separator === -1) return value ? { leadType: 'mortgage', leadId: value } : null;
  if (separator <= 0 || separator === value.length - 1) return null;
  const leadType = normalizeLeadType(value.slice(0, separator));
  return leadType ? { leadType, leadId: value.slice(separator + 1) } : null;
}

export async function findPaymentLead(base44: any, leadType: LeadType, leadId: string) {
  if (leadType === 'mortgage') {
    const lead = (await base44.asServiceRole.entities.Lead.filter({ id: leadId }))?.[0];
    return lead ? { name: lead.fullName, email: lead.email } : null;
  }

  const { serviceRoleKey } = supabaseConfig();
  const endpoint = refinanceUrl('/rest/v1/refinance_leads', leadId);
  endpoint.searchParams.set('select', 'id,full_name,email');
  const response = await fetch(endpoint, { headers: supabaseHeaders(serviceRoleKey) });
  if (!response.ok) throw new Error(`Failed to look up refinance lead (${response.status})`);
  const [lead] = await response.json();
  return lead ? { name: lead.full_name, email: lead.email } : null;
}

export async function markPaymentLeadAsPurchased(base44: any, leadType: LeadType, leadId: string) {
  if (leadType === 'mortgage') {
    await base44.asServiceRole.entities.Lead.update(leadId, { isPurchased: true, status: 'contacted' });
    return;
  }

  const { serviceRoleKey } = supabaseConfig();
  const response = await fetch(refinanceUrl('/rest/v1/refinance_leads', leadId), {
    method: 'PATCH',
    headers: supabaseHeaders(serviceRoleKey, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({ tier: 'paid' }),
  });
  if (!response.ok) throw new Error(`Failed to mark refinance lead as paid (${response.status})`);
  const updatedLeads = await response.json();
  if (!Array.isArray(updatedLeads) || updatedLeads.length !== 1) {
    throw new Error('Refinance lead was not found while recording payment');
  }
}

export async function createCardComCheckout({ leadId, leadType, origin, lead }: {
  leadId: string;
  leadType: LeadType;
  origin: string;
  lead: { name?: string; email?: string };
}) {
  const terminalNumber = Number(Deno.env.get('CARDCOM_TERMINAL_NUMBER'));
  const apiName = Deno.env.get('CARDCOM_API_NAME');
  const webHookUrl = Deno.env.get('CARDCOM_WEBHOOK_URL');
  if (!terminalNumber || !apiName || !webHookUrl) throw new Error('CardCom is not configured');

  const payload = {
    TerminalNumber: terminalNumber,
    ApiName: apiName,
    Operation: 'ChargeOnly',
    Amount: CARDCOM_AMOUNT,
    ISOCoinId: 1,
    Language: 'he',
    ProductName: PRODUCT_NAME,
    ReturnValue: paymentReturnValue(leadType, leadId),
    SuccessRedirectUrl: `${origin}/PaymentReturn?status=success`,
    FailedRedirectUrl: `${origin}/PaymentReturn?status=failed`,
    WebHookUrl: webHookUrl,
    Document: {
      Name: lead.name || 'לקוח',
      Email: lead.email || undefined,
      Products: [{ Description: PRODUCT_NAME, UnitCost: CARDCOM_AMOUNT, Quantity: 1 }],
      IsSendByEmail: Boolean(lead.email),
    },
  };

  const response = await fetch(CARDCOM_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.ResponseCode !== 0 || !data.Url) throw new Error(data.Description || 'CardCom error');
  return { url: data.Url, lowProfileId: data.LowProfileId };
}

export async function getVerifiedCardComResult(lowProfileId: string) {
  const terminalNumber = Number(Deno.env.get('CARDCOM_TERMINAL_NUMBER'));
  const apiName = Deno.env.get('CARDCOM_API_NAME');
  if (!terminalNumber || !apiName) throw new Error('CardCom is not configured');

  const response = await fetch(CARDCOM_RESULT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TerminalNumber: terminalNumber, ApiName: apiName, LowProfileId: lowProfileId }),
  });
  if (!response.ok) throw new Error(`CardCom verification failed (${response.status})`);
  return response.json();
}

export function hasExpectedPaymentAmount(result: any) {
  return Number(result?.TranzactionInfo?.Amount) === CARDCOM_AMOUNT;
}
