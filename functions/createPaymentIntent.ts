import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { amount, currency, metadata } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to agorot
      currency: currency || 'ils',
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
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