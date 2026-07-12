# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"מיקוד משכנתאות" (Mikud) — a Hebrew, right-to-left (RTL) mortgage lead-generation
one-pager for the Israeli market. A prospective borrower fills out a multi-step
mortgage questionnaire, gets an AI-assisted analysis and recommended mortgage
"mixes" (תמהילים), and becomes a **Lead**. A separate admin area lets the Mikud
team view leads and purchase them (Stripe). Built on the **Base44** low-code
platform: the frontend lives here, the backend (entities, auth, serverless
functions, LLM integration) is hosted by Base44.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # production build to ./dist
npm run lint       # eslint . --quiet
npm run lint:fix   # eslint --fix
npm run typecheck  # tsc against jsconfig.json (checkJs; JSDoc-level checks only)
```

There is **no test suite** — do not assume tests exist. Verify changes by
running the app and exercising the flow.

### Environment
Requires `.env.local` (git-ignored) with `VITE_BASE44_APP_ID` and
`VITE_BASE44_APP_BASE_URL`. See README.md. These can also be supplied as URL
query params (`?app_id=…&access_token=…`), which `src/lib/app-params.js` reads
and persists to `localStorage` — this is how Base44 injects credentials when the
app runs inside the Builder.

## Base44 platform coupling (important)

This repo is bound to a Base44 app (`base44/.app.jsonc`). **Changes pushed to
this repo are reflected in the Base44 Builder, and vice-versa.** Consequences:

- `src/pages.config.js` is **auto-generated** from files in `src/pages/`. The
  only line you may edit by hand is `mainPage`. Do not hand-edit imports or the
  `PAGES` map. Every file in `src/pages/` automatically becomes a route
  (`ClientQuestionnaire.jsx` → `/ClientQuestionnaire`); `App.jsx` wires these up.
- `src/vite-plugins`, `src/components/ui`, `src/api`, and `src/lib` are
  platform-managed scaffolding (auth, query client, SDK client, shadcn/ui
  primitives). They are excluded from lint/typecheck (`eslint.config.js`,
  `jsconfig.json`). Treat them as generated; prefer editing app code in
  `src/pages/` and `src/components/mikud/` and `src/components/mortgage/`.
- The Vite `base44` plugin (`vite.config.js`) provides HMR/navigation notifiers
  and a visual edit agent used by the Builder.

### Backend access pattern
All backend calls go through the singleton `base44` client
(`src/api/base44Client.js`, imported as `@/api/base44Client`):

- `base44.entities.Lead.*` — CRUD on the **Lead** entity (the one core domain
  entity; schema is defined in the Base44 dashboard, not in this repo).
- `base44.functions.invoke('<name>', payload)` — calls serverless functions in
  `base44/functions/*/entry.ts` (Deno, run on Base44). Present functions:
  `getBankOfIsraelRates`, `calculateMortgageMixes`, `generatePdfReport`,
  `createCheckoutSession`, `createPaymentIntent`, `stripeWebhook`,
  `sendEmailVerification`, `verifyEmailCode` (server-side email OTP).
- `base44.integrations.Core.InvokeLLM(...)` — LLM calls for the AI analysis /
  Miko chat.
- `base44.auth.*` — `me()`, `logout()`, `redirectToLogin()`.

Backend functions **must not trust client-supplied values** for anything
sensitive: prices come from a fixed Stripe `price_id` server-side, redirect URLs
are validated against an allowlist, and HTML built from client data is escaped
(see the comments in `createCheckoutSession/entry.ts`, `createPaymentIntent/entry.ts`,
`generatePdfReport/entry.ts`). Preserve these invariants when editing.

## Architecture

### Auth & access control
- `src/lib/AuthContext.jsx` (`AuthProvider` / `useAuth`) resolves app public
  settings and, if a token is present, the current user; it drives the
  loading/redirect states in `App.jsx`.
- `src/components/AdminOnly.jsx` gates admin pages (lead PII, dashboards): it
  requires an authenticated user whose Base44 profile `role === 'admin'` and
  renders nothing sensitive until that resolves. Wrap admin pages with it.

### Pages (`src/pages/`)
- `MortgageCalculator.jsx` — the **main page** (`mainPage` in `pages.config.js`)
  and the heart of the app: a large multi-step form + AI analysis + mix
  comparison + lead creation + server-side email verification (OTP sent and
  checked via the `sendEmailVerification` / `verifyEmailCode` functions). This
  is the biggest file.
- `ClientQuestionnaire.jsx` — client-facing questionnaire flow.
- `LeadProfile.jsx` / `AdminDashboard.jsx` — admin: view a lead / dashboard and
  lead purchasing.

### Mortgage domain logic
`src/components/mortgage/mortgageUtils.jsx` is the pure-calculation core (no
React): PMT payment math, DTI/LTV scoring, and the mix generators
(`calculateResults`, `calculateRefinanceResults`, `calcDynamicMix`,
`calcCpiMix`, reverse/senior/balloon rules via constants like
`SENIOR_BANK_MAX_LTV`, `BALLOON_MAX_TERM`). `DEFAULT_RATES` is the fallback rate
table; live rates come from the `getBankOfIsraelRates` function. When touching
mortgage math, change it here, not inline in components.

### UI components
- `src/components/mikud/` — app-specific presentational components (forms,
  Miko avatar/chat, negotiation pack, social proof, PDF-facing analysis, etc.).
- `src/components/mortgage/` — mix cards / comparison / generator UI.
- `src/components/ui/` — shadcn/ui + Radix primitives (platform-managed).

## Conventions

- **Path alias**: `@/` → `src/` (`jsconfig.json`, resolved by Vite). Use it.
- **RTL / Hebrew**: UI text is Hebrew and containers use `dir="rtl"`. Keep new
  UI RTL-correct and match the existing Hebrew microcopy tone.
- **Styling**: Tailwind (`tailwind.config.js`) + `clsx`/`tailwind-merge` via the
  `cn()` helper in `src/lib/utils.js`. Brand navy is `#1e3a5f`.
- **Data fetching**: TanStack Query (`@tanstack/react-query`), provider in
  `App.jsx`, client in `src/lib/query-client.js`.
- **Lint**: unused imports are an **error** (`unused-imports/no-unused-imports`);
  unused vars are warnings unless prefixed `_`. Run `npm run lint` before
  finishing. `checkJs` is on, so JSDoc type errors surface via `npm run typecheck`.
- Payments use Stripe (`@stripe/react-stripe-js`); the fixed lead price lives in
  the backend functions, not the client.
