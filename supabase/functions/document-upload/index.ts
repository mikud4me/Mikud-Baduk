import { json, options } from '../_shared/cors.ts';
import { service } from '../_shared/supabase.ts';

function extension(filename: unknown) {
  const match = typeof filename === 'string' ? filename.match(/\.[a-zA-Z0-9]{1,10}$/) : null;
  return match?.[0] || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { action, filename, path } = await req.json();
    if (action === 'create') {
      const storagePath = `uploads/${crypto.randomUUID()}${extension(filename)}`;
      const { data, error } = await service.storage.from('documents').createSignedUploadUrl(storagePath);
      if (error) throw error;
      return json({ path: storagePath, token: data.token });
    }
    if (action === 'read' && typeof path === 'string' && path.startsWith('uploads/')) {
      const { data, error } = await service.storage.from('documents').createSignedUrl(path, 3600);
      if (error) throw error;
      return json({ signedUrl: data.signedUrl });
    }
    return json({ error: 'Invalid upload request' }, { status: 400 });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Document upload failed' }, { status: 500 }); }
});
