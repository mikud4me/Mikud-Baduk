import { json, options } from '../_shared/cors.ts';
import { service } from '../_shared/supabase.ts';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailPattern.test(normalizedEmail)) return json({ error: 'invalid_email' }, { status: 400 });
    const { data: previous } = await service.from('email_verifications').select('last_sent_at').eq('email', normalizedEmail).order('created_at', { ascending: false }).limit(1);
    if (previous?.[0] && Date.now() - new Date(previous[0].last_sent_at).getTime() < 30_000) return json({ error: 'cooldown' }, { status: 429 });
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) throw new Error('RESEND_API_KEY is not configured');
    const send = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: Deno.env.get('RESEND_FROM') || 'מיקוד משכנתאות <onboarding@resend.dev>', to: [normalizedEmail], subject: 'קוד האימות שלך — מיקוד משכנתאות', text: `קוד האימות שלך הוא: ${code}\n\nהקוד תקף ל-10 דקות.` }) });
    if (!send.ok) throw new Error('email_send_failed');
    await service.from('email_verifications').delete().eq('email', normalizedEmail);
    const { error } = await service.from('email_verifications').insert({ email: normalizedEmail, code_hash: await hash(`${code}:${normalizedEmail}`), expires_at: new Date(Date.now() + 600_000).toISOString() });
    if (error) throw error;
    return json({ ok: true });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Email send failed' }, { status: 500 }); }
});
