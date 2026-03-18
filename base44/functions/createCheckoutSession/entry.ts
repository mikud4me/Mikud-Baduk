import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICE_ID = 'price_1T3b04EHLpLCByr3jIthw8eL';

Deno.serve(async (req) => {
  try {
    const { leadId, successUrl, cancelUrl } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&lead_id=${leadId}`,
      cancel_url: cancelUrl,
      metadata: {
        leadId,
        base44_app_id: Deno.env.get("BASE44_APP_ID")
      }
    });

    console.log(`Checkout session created: ${session.id} for lead: ${leadId}`);
    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Checkout session error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});