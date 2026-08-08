# Mikud Mortgages — Engineering Guide

This is a React/Vite application hosted on Cloudflare Pages. Supabase provides Postgres, Auth, private document storage, and Edge Functions.

## Architecture

- Frontend: `src/`, built with Vite.
- Frontend API adapter: `src/api/appClient.js` and `src/api/refinanceLeads.js`.
- Auth: Supabase magic links; administrator access requires `profiles.role = 'admin'`.
- Database migrations: `supabase/migrations/`.
- Server functions: `supabase/functions/`.
- Private refinance uploads: `documents` Storage bucket via the `document-upload` function.
- Hosting: Cloudflare Pages project `baduk-ai`.
- Production site: `https://baduk-ai.pages.dev` until `baduk-ai.co.il` is attached in Cloudflare.

There is no Base44 runtime, SDK, plugin, configuration, or server code in this repository.

## Local development

Create an ignored `.env.local` file:

```text
VITE_SUPABASE_URL=https://dtqjbszvgkibgvxanvja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Only these public browser values belong in `.env.local`. Never put Gemini, Resend, CardCom, a Supabase secret key, or a database password in a `VITE_*` variable or in Git.

```powershell
npm install
npm run dev
npm run lint
npm run build
```

## Supabase deployment

Project reference: `dtqjbszvgkibgvxanvja`.

First-time setup links the CLI to the project and prompts for the database password:

```powershell
supabase link --project-ref dtqjbszvgkibgvxanvja
```

For every database change, add a new timestamped migration under `supabase/migrations/`; do not modify an already-applied migration. Deploy it with:

```powershell
supabase db push --linked
```

Deploy the Edge Functions after function changes:

```powershell
supabase functions deploy mortgage-leads refinance-leads get-bank-of-israel-rates send-email-verification verify-email-code mortgage-ai create-cardcom-payment verify-cardcom-payment cardcom-webhook generate-pdf-report analyze-refinance-document calculate-refinance-mixes document-upload --project-ref dtqjbszvgkibgvxanvja --use-api
```

Production Edge Function secrets are managed in Supabase **Edge Functions → Secrets**. Required names are:

```text
GEMINI_API_KEY
GEMINI_MODEL
RESEND_API_KEY
RESEND_FROM
CARDCOM_TERMINAL_NUMBER
CARDCOM_API_NAME
CARDCOM_WEBHOOK_URL
ALLOWED_SITE_ORIGINS
```

Secrets become available to functions immediately after saving; a redeployment is not needed just for a secret change.

## Cloudflare Pages deployment

Use `npx wrangler` from the repository. Build before every deployment because Pages receives the generated `dist/` directory.

Preview deployment:

```powershell
npm run build
npx wrangler pages deploy .\dist --project-name baduk-ai --branch preview --commit-message "Describe the change" --commit-dirty=true
```

Production deployment:

```powershell
npm run build
npx wrangler pages deploy .\dist --project-name baduk-ai --branch main --commit-message "Describe the change" --commit-dirty=true
```

Cloudflare DNS and the custom domain are configured separately. After the `baduk-ai.co.il` zone is active in Cloudflare, attach it from **Workers & Pages → baduk-ai → Custom domains**. Do not create a standalone `pages.dev` CNAME before adding the domain in the Pages dashboard.

## Refinance document flow

1. `document-upload` creates a signed upload ticket for the private `documents` bucket.
2. The browser uploads the selected file using the ticket.
3. `document-upload` creates a one-hour signed read URL.
4. `analyze-refinance-document` validates that signed URL against this Supabase project, downloads it, and sends the document bytes to Gemini.

The analyzer must use `SUPABASE_URL` (or `REFINANCE_STORAGE_ORIGIN` when deliberately overridden) for signed-URL validation. Do not hard-code an old project URL.

## Before committing

- Run `npm run lint` and `npm run build`.
- Do not commit `.env.local`, `supabase/.temp/`, or `*_export.csv` files.
- Do not commit API keys, database passwords, CardCom credentials, customer documents, or exports containing customer data.
- Confirm payment flows against CardCom deliberately; a live payment test can create a real transaction.
