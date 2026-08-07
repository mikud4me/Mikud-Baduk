import { json, options } from '../_shared/cors.ts';
import { service } from '../_shared/supabase.ts';

const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { email, code } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const { data: row, error } = await service.from('email_verifications').select('*').eq('email', normalizedEmail).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!row || new Date(row.expires_at).getTime() < Date.now()) return json({ verified: false, reason: 'expired' });
    if (row.attempts >= 5) return json({ verified: false, reason: 'too_many_attempts' });
    if (await hash(`${String(code || '').trim()}:${normalizedEmail}`) !== row.code_hash) {
      await service.from('email_verifications').update({ attempts: row.attempts + 1 }).eq('id', row.id);
      return json({ verified: false, reason: 'invalid' });
    }
    await service.from('email_verifications').update({ verified: true }).eq('id', row.id);
    return json({ verified: true });
  } catch (error) { return json({ verified: false, reason: 'error', error: error instanceof Error ? error.message : 'Verification failed' }, { status: 500 }); }
});
