**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

The refinance quick-check subsystem (`/RefinanceQuickCheck`) talks to its own
Supabase project directly (not through Base44). It falls back to a hardcoded
project URL/publishable key (see `src/components/refinance/supabaseClient.js`
— safe to hardcode, this is the publishable/anon key, not a secret) if these
aren't set, so it works out of the box. Set them to point a build at a
different Supabase project instead:

For CardCom refinance payments, also configure `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in the Base44 function environment. These secrets
are used only server-side to mark the CardCom-verified `refinance_leads` record
as paid.

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The refinance document analyzer is implemented as the portable Deno function
at `base44/functions/analyzeRefinanceDocument/entry.ts`. Base44 hosts its HTTP
endpoint, but the function does not use the Base44 SDK, entities, or
integrations. It downloads the document from its short-lived Supabase signed
URL and analyzes PDFs and images with Gemini only.

Configure `GEMINI_API_KEY` as a Base44 backend secret before deploying the
function. The following settings are optional:

```
# Frontend: normally unset; the app derives Base44's app-scoped function URL
VITE_REFINANCE_ANALYSIS_URL=https://app--your-app-name.base44.app/api/apps/your-app-id/functions/analyzeRefinanceDocument

# Backend: defaults to the current Supabase project origin
REFINANCE_STORAGE_ORIGIN=https://your-project.supabase.co
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
