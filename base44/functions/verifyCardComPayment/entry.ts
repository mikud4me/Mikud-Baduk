import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  getVerifiedCardComResult,
  hasExpectedPaymentAmount,
  markPaymentLeadAsPurchased,
  normalizeLeadType,
  paymentReturnValue,
} from '../_shared/cardCom.ts';

// Client-initiated verification of a CardCom LowProfile payment. Called by the
// borrower's browser right after the payment iframe reports success. Unlike the
// server-to-server webhook (which depends on CardCom's notification being enabled),
// this pulls the result on demand and is the primary path that marks the lead paid.
//
// It is forge-proof: we query CardCom with our own terminal credentials and only
// grant purchase if the transaction succeeded AND its ReturnValue equals the
// leadId we bound at create time — a client cannot fabricate a paid result.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, leadType = 'mortgage', lowProfileId } = await req.json();

    if (!leadId || !lowProfileId) {
      return Response.json({ error: 'leadId and lowProfileId are required' }, { status: 400 });
    }

    const normalizedLeadType = normalizeLeadType(leadType);
    if (!normalizedLeadType) return Response.json({ error: 'Invalid lead type' }, { status: 400 });
    const result = await getVerifiedCardComResult(lowProfileId);

    // ResponseCode 0 = the low-profile deal was paid successfully.
    if (result.ResponseCode !== 0) {
      console.log(`verifyCardComPayment: LP ${lowProfileId} not paid (code ${result.ResponseCode}: ${result.Description})`);
      return Response.json({ paid: false });
    }

    // Bind the payment to this lead and type — ReturnValue is generated only by
    // our create endpoint, so one successful payment cannot unlock another lead.
    const expectedReturnValue = paymentReturnValue(normalizedLeadType, String(leadId));
    const isLegacyMortgageReturnValue = normalizedLeadType === 'mortgage'
      && String(result.ReturnValue) === String(leadId);
    if (String(result.ReturnValue) !== expectedReturnValue && !isLegacyMortgageReturnValue) {
      console.error(`verifyCardComPayment: ReturnValue ${result.ReturnValue} != leadId ${leadId} for LP ${lowProfileId}`);
      return Response.json({ paid: false });
    }
    if (!hasExpectedPaymentAmount(result)) {
      console.error(`verifyCardComPayment: amount mismatch for LP ${lowProfileId}`);
      return Response.json({ paid: false });
    }

    await markPaymentLeadAsPurchased(base44, normalizedLeadType, leadId);
    console.log(`verifyCardComPayment: ${normalizedLeadType} lead ${leadId} marked paid (LP ${lowProfileId}, txn ${result.TranzactionId}, amount ${result.TranzactionInfo?.Amount})`);

    return Response.json({ paid: true });

  } catch (error) {
    console.error('verifyCardComPayment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
