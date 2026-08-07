import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  getVerifiedCardComResult,
  hasExpectedPaymentAmount,
  markPaymentLeadAsPurchased,
  parsePaymentReturnValue,
} from '../_shared/cardCom.ts';

// Server-to-server callback from CardCom after a LowProfile payment. This is the
// trust boundary that grants purchase status — conceptually replaces stripeWebhook.
// We never trust the posted body's success flag; we re-query CardCom with our own
// terminal credentials (GetLpResult) and verify ResponseCode + amount ourselves.

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

    const result = await getVerifiedCardComResult(lowProfileId);

    if (result.ResponseCode !== 0) {
      console.error(`CardCom webhook: unpaid/failed LP ${lowProfileId} (code ${result.ResponseCode})`);
      return Response.json({ received: true }); // ack, but do not grant
    }

    // Guard against amount tampering — the charged sum must be exactly our price.
    if (!hasExpectedPaymentAmount(result)) {
      console.error(`CardCom webhook: amount mismatch for LP ${lowProfileId}`);
      return Response.json({ received: true });
    }

    const paymentLead = parsePaymentReturnValue(result.ReturnValue);
    if (!paymentLead) {
      console.error(`CardCom webhook: invalid ReturnValue for LP ${lowProfileId}`);
      return Response.json({ received: true });
    }

    await markPaymentLeadAsPurchased(base44, paymentLead.leadType, paymentLead.leadId);
    console.log(`${paymentLead.leadType} lead ${paymentLead.leadId} marked as purchased via CardCom (LP ${lowProfileId}, txn ${result.TranzactionId})`);

    return Response.json({ received: true });

  } catch (error) {
    console.error('CardCom webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
