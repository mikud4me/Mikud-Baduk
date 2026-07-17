import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// CardCom (אישורית זהב) v11 LowProfile — creates a hosted payment page we embed
// in an iframe. Credentials live in Base44 function secrets, never in the repo.
const CARDCOM_CREATE_URL = 'https://secure.cardcom.solutions/api/v11/LowProfile/Create';

// The single source of truth for what the report costs. NIS, VAT-included.
// Never trust an amount from the client (same invariant as the Stripe PRICE_ID).
// TODO: TEST VALUE — set back to 589 before go-live. Must match cardComWebhook.
const AMOUNT = 1;
const PRODUCT_NAME = 'דוח תמהיל משכנתא — מיקוד משכנתאות';

// CardCom redirects the (iframe) browser to whatever we hand it here — only ever
// send it to a URL that's actually us. Mirrors createCheckoutSession's allowlist.
const ALLOWED_REDIRECT_HOSTS = ['mikud4me.co.il', 'www.mikud4me.co.il'];

function isAllowedOrigin(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      const host = parsed.hostname;
      return ALLOWED_REDIRECT_HOSTS.includes(host) || host.endsWith('.base44.app');
    }
    // Only allowed over plain http for local development.
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, origin } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }
    if (!isAllowedOrigin(origin)) {
      return Response.json({ error: 'Invalid origin' }, { status: 400 });
    }

    const terminalNumber = Number(Deno.env.get('CARDCOM_TERMINAL_NUMBER'));
    const apiName = Deno.env.get('CARDCOM_API_NAME');
    const webHookUrl = Deno.env.get('CARDCOM_WEBHOOK_URL');
    if (!terminalNumber || !apiName || !webHookUrl) {
      return Response.json({ error: 'CardCom is not configured' }, { status: 500 });
    }

    const existing = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    const lead = existing?.[0];
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // The iframe lands on our /PaymentReturn page, which postMessages the parent.
    // The authoritative unlock is the server-to-server WebHook, not these redirects.
    const successRedirectUrl = `${origin}/PaymentReturn?status=success`;
    const failedRedirectUrl = `${origin}/PaymentReturn?status=failed`;

    const payload = {
      TerminalNumber: terminalNumber,
      ApiName: apiName,
      Operation: 'ChargeOnly',
      Amount: AMOUNT,
      ISOCoinId: 1, // ILS
      Language: 'he',
      ProductName: PRODUCT_NAME,
      ReturnValue: String(leadId), // echoed back to us in the webhook
      SuccessRedirectUrl: successRedirectUrl,
      FailedRedirectUrl: failedRedirectUrl,
      WebHookUrl: webHookUrl,
      // Automatic tax receipt. UnitCost must reconcile to AMOUNT given the
      // terminal's VAT setting (prices-include-VAT) — verify on the test terminal.
      Document: {
        Name: lead.fullName || 'לקוח',
        Email: lead.email || undefined,
        Products: [
          { Description: PRODUCT_NAME, UnitCost: AMOUNT, Quantity: 1 },
        ],
        IsSendByEmail: Boolean(lead.email),
      },
    };

    const resp = await fetch(CARDCOM_CREATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();

    if (data.ResponseCode !== 0 || !data.Url) {
      console.error('CardCom Create failed:', data.ResponseCode, data.Description);
      return Response.json({ error: data.Description || 'CardCom error' }, { status: 500 });
    }

    console.log(`CardCom payment page created for lead ${leadId}: ${data.LowProfileId}`);
    return Response.json({ url: data.Url, lowProfileId: data.LowProfileId });

  } catch (error) {
    console.error('createCardComPayment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
