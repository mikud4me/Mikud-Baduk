import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

export const service = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

export async function isAdminRequest(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const { data: { user } } = await service.auth.getUser(token);
  if (!user) return false;
  const { data } = await service.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return data?.role === 'admin';
}
