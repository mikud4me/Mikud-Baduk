import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Verification codes are generated, stored (hashed), and checked entirely
// server-side. The plaintext code is emailed to the user and NEVER returned to
// the client — the browser must not be able to learn it. Pending codes live in
// the `EmailVerification` entity (functions are stateless across invocations,
// so in-memory storage would not survive between send and verify calls).

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const CODE_TTL_MS = 10 * 60 * 1000; // הקוד תקף ל-10 דקות
const RESEND_COOLDOWN_MS = 30 * 1000; // מרווח מינימלי בין שליחות

// SHA-256 של הקוד, "מומלח" עם כתובת האימייל כדי שקודים זהים לא ייצרו hash זהה.
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
    const { email } = await req.json();

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return Response.json({ error: 'invalid_email' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // בדיקת cooldown ומחיקת רשומות קודמות עבור אותו אימייל
    const existing = await svc.entities.EmailVerification.filter({ email: normalizedEmail });
    const now = Date.now();
    for (const row of existing) {
      if (row.lastSentAt && now - new Date(row.lastSentAt).getTime() < RESEND_COOLDOWN_MS) {
        return Response.json({ error: 'cooldown' }, { status: 429 });
      }
    }
    await Promise.all(existing.map((row) => svc.entities.EmailVerification.delete(row.id)));

    // קוד בן 6 ספרות ממקור אקראי מאובטח
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    const codeHash = await hashCode(code, normalizedEmail);
    const nowIso = new Date(now).toISOString();

    await svc.entities.EmailVerification.create({
      email: normalizedEmail,
      codeHash,
      expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
      attempts: 0,
      verified: false,
      lastSentAt: nowIso,
    });

    await svc.integrations.Core.SendEmail({
      to: normalizedEmail,
      subject: 'קוד האימות שלך — מיקוד משכנתאות',
      from_name: 'מיקוד משכנתאות',
      body:
        `שלום,\n\n` +
        `קוד האימות שלך למיקוד משכנתאות הוא: ${code}\n\n` +
        `הקוד תקף ל-10 דקות. אם לא ביקשת קוד זה, ניתן להתעלם מהודעה זו.\n\n` +
        `בהצלחה,\nצוות מיקוד משכנתאות`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('sendEmailVerification error:', error);
    return Response.json(
      { error: error?.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
});
