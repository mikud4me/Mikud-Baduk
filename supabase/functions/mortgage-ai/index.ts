import { json, options } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options();
  try {
    const { prompt } = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim()) return json({ error: 'prompt is required' }, { status: 400 });
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Gemini request failed');
    const output = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || '';
    if (!output) throw new Error('Gemini returned an empty response');
    return json({ output });
  } catch (error) {
    console.error('mortgage-ai', error);
    return json({ error: error instanceof Error ? error.message : 'AI request failed' }, { status: 500 });
  }
});
