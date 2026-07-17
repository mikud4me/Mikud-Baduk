import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Server-to-server callback from CardCom after a LowProfile payment. This is the
// trust boundary that grants purchase status — conceptually replaces stripeWebhook.
// We never trust the posted body's success flag; we re-query CardCom with our own
// terminal credentials (GetLpResult) and verify ResponseCode + amount ourselves.
const CARDCOM_RESULT_URL = 'https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult';

const AMOUNT = 589; // must match createCardComPayment

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // CardCom may deliver the notification as JSON body or as query params.
    let lowProfileId;
    try {
      const body = await req.json();
      lowProfileId = body?.LowProfileId ?? body?.lowProfileId;
    } catch {
      // not JSON — fall through to query params
    }
    if (!lowProfileId) {
      lowProfileId = new URL(req.url).searchParams.get('LowProfileId') || undefined;
    }
    if (!lowProfileId) {
      console.error('CardCom webhook: no LowProfileId in request');
      return Response.json({ error: 'Missing LowProfileId' }, { status: 400 });
    }

    const terminalNumber = Number(Deno.env.get('CARDCOM_TERMINAL_NUMBER'));
    const apiName = Deno.env.get('CARDCOM_API_NAME');

    // Authoritative re-verification against CardCom.
    const resp = await fetch(CARDCOM_RESULT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TerminalNumber: terminalNumber, ApiName: apiName, LowProfileId: lowProfileId }),
    });
    const result = await resp.json();

    if (result.ResponseCode !== 0) {
      console.error(`CardCom webhook: unpaid/failed LP ${lowProfileId} (code ${result.ResponseCode})`);
      return Response.json({ received: true }); // ack, but do not grant
    }

    // Guard against amount tampering — the charged sum must be exactly our price.
    const paidAmount = Number(result.TranzactionInfo?.Amount);
    if (paidAmount !== AMOUNT) {
      console.error(`CardCom webhook: amount mismatch for LP ${lowProfileId}: got ${paidAmount}, expected ${AMOUNT}`);
      return Response.json({ received: true });
    }

    const leadId = result.ReturnValue;
    if (!leadId) {
      console.error(`CardCom webhook: no ReturnValue (leadId) for LP ${lowProfileId}`);
      return Response.json({ received: true });
    }

    // Confirm the lead exists before granting purchase status (a stale/malformed
    // id should never silently succeed) — same shape as stripeWebhook.
    const existing = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!existing?.[0]) {
      console.error(`CardCom webhook: no lead found for id ${leadId}`);
      return Response.json({ received: true });
    }

    await base44.asServiceRole.entities.Lead.update(leadId, {
      isPurchased: true,
      status: 'contacted',
    });
    console.log(`Lead ${leadId} marked as purchased via CardCom (LP ${lowProfileId}, txn ${result.TranzactionId})`);

    return Response.json({ received: true });

  } catch (error) {
    console.error('CardCom webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
