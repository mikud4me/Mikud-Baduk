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

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const leadId = paymentIntent.metadata?.leadId;

    if (leadId) {
      try {
        await base44.asServiceRole.entities.Lead.update(leadId, {
          isPurchased: true,
          status: 'contacted'
        });
        console.log(`Lead ${leadId} marked as purchased`);
      } catch (error) {
        console.error('Failed to update lead:', error);
      }
    }
  }

  return Response.json({ received: true });
});