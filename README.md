# meeeyu — me + yu

A playful social scrapbook. You build part of your profile; your friends
build the rest. This is the V1 (MVP) build: Next.js (App Router) + TypeScript
+ Tailwind CSS v4, backed by Supabase (Postgres, Auth, Storage).

## What's here

- **Auth** — passwordless email one-time-code sign-in (`/login`)
- **Onboarding** — username → photo → favourite things → 5 prompts → generated scrapbook (`/onboarding/*`)
- **Public profile** — `meeeyu.app/<username>`, a scrapbook of polaroids, sticky
  notes and torn-paper cards, plus the "me vs you" comparison for any prompt
  friends have answered
- **Owner edit mode** — `meeeyu.app/<username>/edit` to add/reorder/remove
  cards, answer more prompts, change vibe/bio/photo
- **Viral loop** — `meeeyu.app/ask/<token>` lets anyone answer a question
  about a profile owner with zero sign-up, then nudges them to make their own
  meeeyu. Every prompt row also has a one-tap "ask friends this question" share link.
- **Reactions** — lightweight emoji taps on a profile

Out of scope for V1 (by design — see the product brief): drag-and-drop
reordering (arrow buttons instead), a proper follow-based discovery feed,
notifications, and native mobile apps. The data layer (`src/lib/db/*`) is
plain Supabase queries with no Next.js-specific coupling, so a React Native
client can reuse it later.

## Getting started

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then in the SQL
editor run, in order:

1. `supabase/migrations/0001_init.sql` — tables, RLS policies, and the
   public `avatars` storage bucket
2. `supabase/seed.sql` — the starter prompt catalog ("what animal would I
   be?", etc.)

### 2. Enable email OTP codes

Sign-in uses a 6-digit code, not a magic link. In your Supabase dashboard:
**Authentication → Emails → Confirm signup / Magic Link** templates — make
sure the body includes `{{ .Token }}` (Supabase's default template already
does since 2023; if you've customised it, add it back).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's API settings, and `NEXT_PUBLIC_SITE_URL` (used to
build shareable links — `http://localhost:3000` for local dev).

### 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                    routes (App Router)
    [username]/           public profile + /edit
    ask/[token]/           no-login friend-answer flow
    onboarding/            5-step onboarding wizard
    login/
  components/
    scrapbook/             Polaroid, StickyNote, TornPaper, TapeStrip, CardTile
    onboarding/, edit/, profile/, ask/, share/, ui/
  lib/
    supabase/              browser / server / middleware clients
    db/                    plain query functions per table (profiles, cards,
                           prompts, answers, share, reactions, follows) —
                           the reusable data layer
    aggregate.ts           "me vs you" answer aggregation (pure function)
    types.ts                hand-authored Supabase Database types
supabase/
  migrations/0001_init.sql schema + RLS
  seed.sql                 prompt catalog
```

## Notes on the data model

- A **prompt** ("what animal would I be?") is global and shared across
  profiles. A **self answer** is the owner's take; a **friend answer** is
  someone else's. The public profile aggregates friend answers per prompt
  (`src/lib/aggregate.ts`) to show the top answer and what % of friends
  picked it — the "me vs you" split.
- **Share links** (`share_links`) are tokenised and either general (share
  the whole profile) or tied to one prompt (share a single question). RLS
  lets an anonymous visitor insert a friend answer only if they're holding a
  valid token; a signed-in user can also answer directly on a public profile
  without one.
- `src/lib/types.ts`'s `Database` type is hand-written to mirror the SQL
  migration. If you add columns/tables, update both, or swap in
  `supabase gen types typescript` once you have a live project.
