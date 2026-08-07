import { cardComResult, recordPaid } from '../_shared/cardcom.ts';
import { json, options } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    let lowProfileId: string | null = new URL(req.url).searchParams.get('LowProfileId');
    if (!lowProfileId) {
      const body = await req.json().catch(() => ({}));
      lowProfileId = body.LowProfileId || body.lowProfileId || null;
    }
    if (!lowProfileId) return json({ error: 'Missing LowProfileId' }, { status: 400 });
    await recordPaid(lowProfileId, await cardComResult(lowProfileId));
    return json({ received: true });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Webhook failed' }, { status: 500 }); }
});
