import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Client-initiated verification of a CardCom LowProfile payment. Called by the
// borrower's browser right after the payment iframe reports success. Unlike the
// server-to-server webhook (which depends on CardCom's notification being enabled),
// this pulls the result on demand and is the primary path that marks the lead paid.
//
// It is forge-proof: we query CardCom with our own terminal credentials and only
// grant purchase if the transaction succeeded AND its ReturnValue equals the
// leadId we bound at create time — a client cannot fabricate a paid result.
const CARDCOM_RESULT_URL = 'https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, lowProfileId } = await req.json();

    if (!leadId || !lowProfileId) {
      return Response.json({ error: 'leadId and lowProfileId are required' }, { status: 400 });
    }

    const terminalNumber = Number(Deno.env.get('CARDCOM_TERMINAL_NUMBER'));
    const apiName = Deno.env.get('CARDCOM_API_NAME');
    if (!terminalNumber || !apiName) {
      return Response.json({ error: 'CardCom is not configured' }, { status: 500 });
    }

    const resp = await fetch(CARDCOM_RESULT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TerminalNumber: terminalNumber, ApiName: apiName, LowProfileId: lowProfileId }),
    });
    const result = await resp.json();

    // ResponseCode 0 = the low-profile deal was paid successfully.
    if (result.ResponseCode !== 0) {
      console.log(`verifyCardComPayment: LP ${lowProfileId} not paid (code ${result.ResponseCode}: ${result.Description})`);
      return Response.json({ paid: false });
    }

    // Bind the payment to this lead — ReturnValue was set to leadId in create.
    if (String(result.ReturnValue) !== String(leadId)) {
      console.error(`verifyCardComPayment: ReturnValue ${result.ReturnValue} != leadId ${leadId} for LP ${lowProfileId}`);
      return Response.json({ paid: false });
    }

    const existing = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!existing?.[0]) {
      console.error(`verifyCardComPayment: no lead found for id ${leadId}`);
      return Response.json({ paid: false });
    }

    await base44.asServiceRole.entities.Lead.update(leadId, {
      isPurchased: true,
      status: 'contacted',
    });
    console.log(`verifyCardComPayment: lead ${leadId} marked paid (LP ${lowProfileId}, txn ${result.TranzactionId}, amount ${result.TranzactionInfo?.Amount})`);

    return Response.json({ paid: true });

  } catch (error) {
    console.error('verifyCardComPayment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
