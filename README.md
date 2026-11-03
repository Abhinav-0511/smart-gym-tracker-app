# LifeTrack

Fitness, Productivity and Finance workspaces in one offline-capable PWA.

## Structure

```
frontend/   React + Vite + TypeScript app (all source, public assets, configs, tests)
supabase/   Database migrations, seed data and Supabase CLI config
docs/       Company / project documents
vercel.json Vercel build + routing config (builds frontend/, serves frontend/dist)
```

## Frontend

```
cd frontend
cp .env.example .env     # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # http://localhost:8080
npm run check            # typecheck + lint + tests + build
```

## Supabase

Run Supabase CLI commands from the repository root (e.g. `supabase db push`).

## Deployment

Vercel uses the root `vercel.json`, which installs and builds inside `frontend/`
and publishes `frontend/dist`. Environment variables (`VITE_SUPABASE_*`) are
configured in the Vercel project settings.
