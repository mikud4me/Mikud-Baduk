import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// Same fixed price used for lead purchases as createCheckoutSession — the single
// source of truth for what a lead costs. Never trust a price/amount from the client.
const LEAD_PRICE_ID = 'price_1T3b04EHLpLCByr3jIthw8eL';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!existing?.[0]) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const price = await stripe.prices.retrieve(LEAD_PRICE_ID);
    if (!price.unit_amount || !price.currency) {
      return Response.json({ error: 'Lead price is not configured' }, { status: 500 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        leadId,
        base44_app_id: Deno.env.get("BASE44_APP_ID")
      }
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment Intent creation error:', error);
    return Response.json({
      error: error.message || 'Failed to create payment intent'
    }, { status: 500 });
  }
});