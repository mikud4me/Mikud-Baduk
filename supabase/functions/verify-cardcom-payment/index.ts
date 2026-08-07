import { cardComResult, recordPaid } from '../_shared/cardcom.ts';
import { json, options } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { leadId, leadType = 'mortgage', lowProfileId } = await req.json();
    if (!leadId || !lowProfileId || (leadType !== 'mortgage' && leadType !== 'refinance')) return json({ error: 'Invalid payment request' }, { status: 400 });
    const paid = await recordPaid(lowProfileId, await cardComResult(lowProfileId), { leadType, leadId });
    return json({ paid });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Payment verification failed' }, { status: 500 }); }
});
