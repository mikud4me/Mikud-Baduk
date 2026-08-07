import { createCheckout, isAllowedOrigin } from '../_shared/cardcom.ts';
import { json, options } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { leadId, leadType = 'mortgage', origin } = await req.json();
    if (!leadId || (leadType !== 'mortgage' && leadType !== 'refinance')) return json({ error: 'Invalid payment request' }, { status: 400 });
    if (!isAllowedOrigin(origin)) return json({ error: 'Invalid origin' }, { status: 400 });
    return json(await createCheckout(leadType, leadId, origin));
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Payment setup failed' }, { status: 500 }); }
});
