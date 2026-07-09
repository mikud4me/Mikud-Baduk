import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICE_ID = 'price_1T3b04EHLpLCByr3jIthw8eL';

// Stripe will redirect the customer's browser to whatever we hand it here —
// only ever send it somewhere that's actually us, never a client-supplied URL.
const ALLOWED_REDIRECT_HOSTS = ['mikud4me.co.il', 'www.mikud4me.co.il'];

function isAllowedRedirectUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      const host = parsed.hostname;
      return ALLOWED_REDIRECT_HOSTS.includes(host) || host.endsWith('.base44.app');
    }
    // Only allowed over plain http for local development.
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, successUrl, cancelUrl } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }

    if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
      return Response.json({ error: 'Invalid redirect URL' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (!existing?.[0]) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
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