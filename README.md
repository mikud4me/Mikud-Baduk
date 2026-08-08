# Mikud Mortgages

React/Vite frontend hosted on Cloudflare Pages, with Supabase for data, authentication, storage, and server functions.

## Local setup

1. Copy `.env.example` to `.env.local` and enter the Supabase URL and publishable key.
2. Run `npm install` and `npm run dev`.
3. Never place service-role, CardCom, Resend, or Gemini credentials in `.env.local` or any `VITE_*` variable.

## Supabase setup

This deployment uses project `dtqjbszvgkibgvxanvja` (`https://dtqjbszvgkibgvxanvja.supabase.co`). Link the project, apply the migrations, then deploy every function:

```powershell
supabase link --project-ref dtqjbszvgkibgvxanvja
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
supabase secrets set CARDCOM_TERMINAL_NUMBER=... CARDCOM_API_NAME=... CARDCOM_WEBHOOK_URL="https://dtqjbszvgkibgvxanvja.supabase.co/functions/v1/cardcom-webhook"
supabase secrets set ALLOWED_SITE_ORIGINS="https://baduk-ai.co.il,https://www.baduk-ai.co.il"
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
$env:SUPABASE_URL='https://dtqjbszvgkibgvxanvja.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='YOUR_SERVICE_ROLE_KEY'
node scripts/import-base44-export.mjs .
```

4. Reconcile lead and mix counts, source IDs, paid status, and a sample of financial fields before changing DNS.
5. No CardCom dashboard change is normally needed: each checkout request supplies its callback URL from `CARDCOM_WEBHOOK_URL`. Confirm with CardCom only if the terminal has a separate callback-domain allowlist.

## Cloudflare Pages

Create a Pages project with build command `npm run build` and output directory `dist`, or use a direct Wrangler deployment when repository integration is unavailable. Configure the two `VITE_*` values from `.env.example` for Preview and Production. Attach `baduk-ai.co.il` (and `www.baduk-ai.co.il` if desired) only after the final data reconciliation.

### Domain setup

The domain can remain registered with its current provider. Because `baduk-ai.co.il` is the apex domain, add it as a zone in the same Cloudflare account as the Pages project, then change its nameservers at the registrar to the two Cloudflare nameservers shown in the zone overview. Before changing nameservers, copy any existing email and verification records (including Resend SPF/DKIM records) into Cloudflare DNS.

After the zone is active and the Pages project has a successful deployment, add `baduk-ai.co.il` through **Workers & Pages → project → Custom domains**. Cloudflare creates the necessary DNS record and TLS certificate. Do not add a standalone CNAME to `*.pages.dev` before associating the domain in the Pages dashboard; Cloudflare will reject that configuration. Add `www.baduk-ai.co.il` separately only if it will be used, then redirect it to the apex domain.

## Cutover checklist

1. Confirm preview deployment: public calculator, refinance document analysis, email verification, magic-link admin access, report generation, and both CardCom success/failure paths.
2. Stop writes on the old app, take a final export, rerun the importer, and validate totals.
3. Deploy production functions and frontend, confirm the CardCom callback secret, then change DNS.
4. Keep the prior system read-only for 30 days. After the retention window, remove the archived `base44/` source folder and cancel the old service.
