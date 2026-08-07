import { supabase } from '@/components/refinance/supabaseClient';

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(user) {
  if (!supabase || !user) return false;
  const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return !error && data?.role === 'admin';
}
