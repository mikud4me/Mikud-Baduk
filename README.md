# Mikud Mortgages

React/Vite frontend hosted on Cloudflare Pages, with Supabase for data, authentication, storage, and server functions.

## Local setup

1. Copy `.env.example` to `.env.local` and enter the Supabase URL and publishable key.
2. Run `npm install` and `npm run dev`.
3. Never place service-role, CardCom, Resend, or Gemini credentials in `.env.local` or any `VITE_*` variable.

## Supabase setup

This deployment uses project `nkihunpgionvbgbslmfa` (`https://nkihunpgionvbgbslmfa.supabase.co`), in the `avkqawhrjywwrjpyctgo` org ("office@mikud4me.co.il's Org"). The prior project (`dtqjbszvgkibgvxanvja`) is paused and no longer in use. Link the project, apply the migrations, then deploy every function:

```powershell
supabase link --project-ref nkihunpgionvbgbslmfa
supabase db push
supabase functions deploy mortgage-leads
supabase functions deploy refinance-leads
supabase functions deploy get-bank-of-israel-rates
supabase functions deploy send-email-verification
supabase functions deploy verify-email-code
supabase functions deploy mortgage-ai
supabase functions deploy create-cardcom-payment
supabase functions deploy verify-cardcom-payment
supabase functions deploy cardcom-webhook
supabase functions deploy generate-pdf-report
supabase functions deploy analyze-refinance-document
supabase functions deploy calculate-refinance-mixes
supabase functions deploy document-upload
```

Configure these server-side secrets in Supabase. Replace only the values represented by `...`; they must not be set as Cloudflare or `VITE_*` variables.

```powershell
supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-3.5-flash
supabase secrets set RESEND_API_KEY=... RESEND_FROM="Mikud Mortgages <noreply@baduk-ai.co.il>"
# RESEND_API_KEY is currently unset on the live project — tolerated only because
# EMAIL_VERIFICATION_ENABLED = false in src/lib/demoMode.js, which stops the frontend
# from ever calling send-email-verification/verify-email-code. Set this secret before
# flipping that flag back to true.
supabase secrets set CARDCOM_TERMINAL_NUMBER=... CARDCOM_API_NAME=... CARDCOM_WEBHOOK_URL="https://nkihunpgionvbgbslmfa.supabase.co/functions/v1/cardcom-webhook"
supabase secrets set ALLOWED_SITE_ORIGINS="https://baduk-ai.co.il,https://www.baduk-ai.co.il,https://baduk-ai-a2y.pages.dev"
```

Create each administrator in Supabase Auth with an email invitation, then run this in the SQL editor for that user:

```sql
insert into public.profiles (id, role)
values ('AUTH_USER_UUID', 'admin')
on conflict (id) do update set role = excluded.role;
```

The logo and footer image are bundled in `src/assets/brand`, so no legacy storage URL is needed.

## One-time data migration

1. During the maintenance window, export the prior entities. The supplied Base44 CSV files (`Lead_export.csv`, `MortgageMix_export.csv`, and `EmailVerification_export.csv`) are supported directly, as is a JSON file with `leads`, `mortgageMixes`, and `emailVerifications` arrays.
2. Preserve the raw export as an encrypted cutover backup.
3. Import the data:

```powershell
$env:SUPABASE_URL='https://nkihunpgionvbgbslmfa.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='YOUR_SERVICE_ROLE_KEY'
node scripts/import-base44-export.mjs .
```

4. Reconcile lead and mix counts, source IDs, paid status, and a sample of financial fields before changing DNS.
5. No CardCom dashboard change is normally needed: each checkout request supplies its callback URL from `CARDCOM_WEBHOOK_URL`. Confirm with CardCom only if the terminal has a separate callback-domain allowlist.

## Cloudflare Pages

Deployed via direct `npx wrangler pages deploy` (no Git-connected build integration configured). Project name `baduk-ai`, on the `office@mikud4me.co.il` Cloudflare account. Its `*.pages.dev` alias is `baduk-ai-a2y.pages.dev`, not `baduk-ai.pages.dev` — that subdomain belongs to a different, unrelated Cloudflare account, so Cloudflare assigned a suffixed alias here instead. Configure the two `VITE_*` values from `.env.example` (via a local `.env.local`, since there's no Git-integration build step to set them in the Pages dashboard) before every build/deploy.

### Domain setup

`baduk-ai.co.il` is already live: the zone lives in the same Cloudflare account as the Pages project, nameservers were switched at the registrar, and the domain is attached under **Workers & Pages → baduk-ai → Custom domains**. This is the current working setup, not a pending task.

If redoing this on a new account in the future: add the zone in the target Cloudflare account, switch the registrar's nameservers to the two Cloudflare nameservers shown in the zone overview (after copying any existing email/verification records, including Resend SPF/DKIM, into Cloudflare DNS first), then attach the domain from **Workers & Pages → project → Custom domains** — only after the zone is active and the Pages project has a successful deployment. Do not add a standalone CNAME to `*.pages.dev` before that; Cloudflare will reject it.

## Cutover checklist

1. Confirm preview deployment: public calculator, refinance document analysis, email verification, magic-link admin access, report generation, and both CardCom success/failure paths.
2. Stop writes on the old app, take a final export, rerun the importer, and validate totals.
3. Deploy production functions and frontend, confirm the CardCom callback secret, then change DNS.
4. Keep the prior system read-only for 30 days. After the retention window, remove the archived `base44/` source folder and cancel the old service.
