import { createClient } from '@supabase/supabase-js';

// Shared Supabase client for the application. Uses the publishable key
// only — safe to expose in the frontend bundle. Every Edge Function call and
// table access from this subsystem is anonymous by design (no user login).
//
// Fallback values below are the same project's publishable/anon key + URL —
// not secrets (Supabase's whole design has this pair shipped in every client
// bundle; RLS, not secrecy, is what's supposed to protect the data). Hardcoded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Kept as a guard (rather than constructing unconditionally) for the same
// reason as before: this module sits on the static import chain App.jsx ->
// pages.config.js -> RefinanceQuickCheck.jsx -> here, so a createClient()
// throw (e.g. both the env var and the fallback ever being cleared) would
// white-screen the *entire* app, not just this page. RefinanceQuickCheck.jsx
// checks `isSupabaseConfigured` and renders a "not configured" state instead
// of using `supabase` when it's false.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Uploads to the private `documents` bucket, then mints a one-hour signed URL.
// The refinance analyzer downloads the file through that URL without receiving
// any Supabase service-role credential.
export async function uploadFileToStorage(file) {
  // Deliberately drop the original filename from the storage path — a Hebrew
  // (or any non-ASCII/special-character) filename embedded in the object key
  // was breaking downstream signed-URL construction/fetching with a 400 Bad
  // Request (found via live testing 2026-07-29). A UUID + the file's own
  // extension is always ASCII-safe and carries everything the backend
  // functions need (they only ever inspect the extension, never the name).
  const { data: uploadTicket, error: ticketError } = await supabase.functions.invoke('document-upload', {
    body: { action: 'create', filename: file.name },
  });
  if (ticketError) throw ticketError;
  const { path, token } = uploadTicket || {};
  if (!path || !token) throw new Error('Document upload ticket is missing');
  const { error: uploadError } = await supabase.storage.from('documents').uploadToSignedUrl(path, token, file);
  if (uploadError) throw uploadError;
  const { data: signedData, error: signedError } = await supabase.functions.invoke('document-upload', {
    body: { action: 'read', path },
  });
  if (signedError) throw signedError;
  return signedData.signedUrl;
}
