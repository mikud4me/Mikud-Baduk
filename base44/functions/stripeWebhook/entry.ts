import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!signature) {
    console.error('No Stripe signature found');
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log('Stripe webhook event:', event.type);

  // Both Stripe amount and metadata below come from the verified event payload
  // (signature-checked above), not from any request we don't control — but we
  // still confirm the lead exists before granting purchase status, since a
  // stale or malformed leadId should never silently succeed.
  const markLeadPurchased = async (leadId, source) => {
    const existing = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!existing?.[0]) {
      console.error(`Webhook (${source}): no lead found for id ${leadId}`);
      return;
    }
    await base44.asServiceRole.entities.Lead.update(leadId, {
      isPurchased: true,
      status: 'contacted'
    });
    console.log(`Lead ${leadId} marked as purchased via ${source}`);
  };

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const leadId = session.metadata?.leadId;

    if (leadId && session.payment_status === 'paid') {
      try {
        await markLeadPurchased(leadId, 'checkout');
      } catch (error) {
        console.error('Failed to update lead:', error);
      }
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const leadId = paymentIntent.metadata?.leadId;
    if (leadId) {
      try {
        await markLeadPurchased(leadId, 'payment_intent');
      } catch (error) {
        console.error('Failed to update lead:', error);
      }
    }
  }

  return Response.json({ received: true });
});