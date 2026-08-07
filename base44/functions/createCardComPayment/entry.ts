import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createCardComCheckout, findPaymentLead, isAllowedOrigin, normalizeLeadType } from '../_shared/cardCom.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, leadType = 'mortgage', origin } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }
    if (!isAllowedOrigin(origin)) {
      return Response.json({ error: 'Invalid origin' }, { status: 400 });
    }
    const normalizedLeadType = normalizeLeadType(leadType);
    if (!normalizedLeadType) return Response.json({ error: 'Invalid lead type' }, { status: 400 });

    const lead = await findPaymentLead(base44, normalizedLeadType, leadId);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const checkout = await createCardComCheckout({ leadId, leadType: normalizedLeadType, origin, lead });
    console.log(`CardCom payment page created for ${normalizedLeadType} lead ${leadId}: ${checkout.lowProfileId}`);
    return Response.json(checkout);

  } catch (error) {
    console.error('createCardComPayment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
