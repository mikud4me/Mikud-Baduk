import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Server-side verification counterpart of sendEmailVerification. The client
// sends the email + the code the user typed; we compare against the stored hash.
// The plaintext code never leaves the server on the send side, and here we only
// ever return a boolean result (with a machine-readable reason), never the code.

const MAX_ATTEMPTS = 5;

async function hashCode(code: string, email: string): Promise<string> {
  const data = new TextEncoder().encode(`${code}:${email.toLowerCase()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedCode = typeof code === 'string' ? code.trim() : '';
    if (!normalizedEmail || !normalizedCode) {
      return Response.json({ verified: false, reason: 'invalid' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // הרשומה העדכנית ביותר עבור האימייל
    const rows = await svc.entities.EmailVerification.filter(
      { email: normalizedEmail },
      '-created_date',
      1
    );
    const row = rows?.[0];

    if (!row || !row.expiresAt || new Date(row.expiresAt).getTime() < Date.now()) {
      return Response.json({ verified: false, reason: 'expired' });
    }

    if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
      return Response.json({ verified: false, reason: 'too_many_attempts' });
    }

    const candidateHash = await hashCode(normalizedCode, normalizedEmail);
    if (candidateHash !== row.codeHash) {
      await svc.entities.EmailVerification.update(row.id, {
        attempts: (row.attempts ?? 0) + 1,
      });
      return Response.json({ verified: false, reason: 'invalid' });
    }

    await svc.entities.EmailVerification.update(row.id, { verified: true });
    return Response.json({ verified: true });
  } catch (error) {
    console.error('verifyEmailCode error:', error);
    return Response.json(
      { verified: false, reason: 'error', error: error?.message },
      { status: 500 }
    );
  }
});
