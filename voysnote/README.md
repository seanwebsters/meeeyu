# VoysNote

**30 seconds a day from the world's most interesting people.**

VoysNote is one giant group chat. Creators, founders, musicians, athletes,
actors and experts *join the group* and occasionally drop a voice note of
thirty seconds or less. The product isn't a content library. It's the
moment someone interesting joins, and the question it leaves behind:
*who's going to join next?*

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Motion
(Framer Motion). Supabase and Stripe are optional: with no keys set, it runs
as a complete demo.

## Run it

```bash
cd voysnote
npm install
npm run dev        # http://localhost:3000
```

No environment variables are needed. You'll go through onboarding, land in
The Group, and about 30 seconds later watch someone new join live:
"Someone new is joining…", then the join, then "Noor is recording…", then
the note.

### Demo audio

The seeded notes are fictional, so they have no recordings. The player reads
each transcript aloud with the browser's speech synthesis and shows live
captions, so the whole experience is audible. Real uploads (admin → Notes)
play through a normal `<audio>` element. Turn the synthesised voice off in
Profile → Demo voice.

Portraits are hotlinked from Unsplash. If one can't load, a warm monogram
takes its place.

## What's in it

| Screen | Route | Notes |
| --- | --- | --- |
| Onboarding | `/welcome` | Red colour-block welcome, Apple / Google / email, interest tiles, name, "You joined the group." |
| The Group | `/` | The home screen. Group / Following / For You tabs over one chronological conversation: join cards, note cards (heart, replies, save, share), "people listening" lines, "Someone new is joining…" with live listener presence, "is recording…", and a "Who's next?" teaser. Opens at the latest message. |
| Discover | `/discover` | Search, categories, recently joined, trending voices, featured series, recommended for you |
| Creator profile | `/c/[username]` | Editorial portrait, Founding Voice, follow, series, all their notes |
| Saved | `/saved` | Saved notes, collections (VoysNote+), recently played |
| Notifications | `/notifications` | Joins, first drops, followed creators, exclusive drops, new series |
| VoysNote+ | `/plus` | £5.99/month paywall |
| Creator Series | `/series/[id]` | 30 Days of Confidence (£9.99), 30 Days of Courage (free, presented by Northbound), Studio Notes (£4.99/mo); daily unlocks and a progress tracker |
| Shared note | `/n/[id]` | Landing page for shared links: an 8-second preview, then "Join the group to hear the rest" |
| Story card | `/api/story` | 1080×1920 PNG for Instagram/TikTok Stories (`format=og` gives 1200×630) |
| Admin | `/admin` | Add or verify creators, mark Founding Voices, upload audio (≤30s, waveform extracted), schedule drops and joins, premium / early access, sponsors, series |

### The player

`src/lib/audio/engine.ts` is a single app-wide engine that lives outside
React:

- Only one note plays at a time.
- Playback carries on while you scroll or change tabs. A mini player
  appears whenever the playing card is off-screen.
- The waveform animates while playing and doubles as the progress bar.
  Tap or drag it to seek.
- The playing card expands, shows live captions and a progress line, and
  the creator's portrait pulses.
- Autoplay moves on to the next note (toggle it in Profile).
- Media Session integration gives lock-screen and headphone controls.

### Entitlements

`src/lib/access.ts` decides what a listener can hear. RLS in the migration
mirrors the same rules on the server.

- **Free:** the last 7 days of the group, reactions, follows, saves, sharing.
- **VoysNote+:** the full archive, exclusive notes, early access, saved
  collections, and no sponsored drops.
- **Series:** Day 1 is always free. After that, one episode unlocks per day
  from purchase, or all at once for `unlockCadence: "all"`.

### Design

Gen Z, dark by default, with four flat colours. Off-black backgrounds,
off-white type and flat surfaces carry the thread, and the palette makes
the big moments loud.

| Colour | Hex | Partner (big type and asterisks on it) |
| --- | --- | --- |
| Red | `#EB4213` | light green |
| Pink | `#FF99DC` | red |
| Purple | `#826DEE` | pink |
| Light green | `#D8F382` | purple |

`src/lib/palette.ts` holds the palette, the pairs and `pairFor(id)`, which
gives every creator a stable colour pair. Partners only ever carry big
display type and graphics; small text on a colour block is black, for
contrast.

- **Colour blocks:** the welcome screen is red with a giant spinning green
  asterisk. Every "joined the group" moment is a full block in that
  creator's pair. "Who's next?" is purple and pink, and VoysNote+ is a
  purple block.
- **Light green** (`--accent`) is the action colour: primary buttons, the
  "+" button, the played part of the waveform and "now playing".
- **Categories and interests** cycle red, pink, purple, green.
- **Bricolage Grotesque** for the wordmark and headings; Inter for
  everything else.
- **Stickers:** portraits are rounded squares with a white die-cut border
  and a slight tilt. Without a photo they become a colour block with a
  monogram.
- **Story cards** are red, with a green headline and an asterisk. The app
  icon is a green V on red.
- **A floating glass dock** for navigation, pill tabs, and **emoji bursts**
  when you react.
- **Casual microcopy:** "12K in the chat · 4,281 tuned in", "someone's
  about to join 👀", "who's next? 👀" and "ping me".

The colour tokens in `src/app/globals.css` are semantic ("cream" is the
background, "ink" the foreground), so a light theme is a token swap.

Navigation is Home / Discover / **+** / Saved / Profile. Listeners don't
post, so the **+** button grows the group instead: invite a friend,
suggest who should join next, or start a collection.

Each card shows a heart (tap to like, press and hold for 🔥 ❤️ 🙌 🤯 💭)
and a reply count. Replies open in a sheet. The demo seeds a few replies
per note and stores your own locally; there's also a `replies` table in
the migration.

## Seed content

`src/lib/demo/seed.ts` holds the demo content:

- 17 fictional creators across all eight categories.
- 35 voice notes, 34 of them published (one is still scheduled).
- One VoysNote+ exclusive and one early-access drop.
- One sponsored drop in the main group.
- Three series.

Times are stored as "minutes ago" and resolved at session start, so the
group always feels current. Noor joins live during your first minute, and
Hana is scheduled for a few hours later and teased.

## Architecture

```
src/
  lib/                  framework-free core, reusable by a native client
    types.ts            domain model (User, Creator, VoiceNote, Series, …)
    access.ts           entitlement rules
    feed.ts             builds The Group conversation + "who's next" state
    notifications.ts    derives notifications from group activity
    catalog.ts          seed + admin + remote catalog merging
    audio/              player engine, upload analysis
    store/              tiny external stores (app state, clock)
    supabase/           client + sync layer (no-ops in demo mode)
    checkout.ts         Stripe Checkout, or a simulated unlock in demo
  components/           UI (group, note, creator, series, admin, shell)
  app/                  routes; (app) is the tabbed shell
supabase/migrations/    schema, RLS, triggers, storage buckets
```

State changes are optimistic and local, then mirrored to Supabase when it's
configured (`src/lib/supabase/sync.ts`). Every remote call no-ops without
keys, so UI code never branches on demo vs. production.

**Going native.** Nothing in `src/lib` imports Next.js or touches the DOM,
apart from the audio engine's `<audio>` and speech calls. An Expo app can
reuse the types, feed builder, access rules, stores and Supabase sync as-is,
and only needs a native player behind the same `player` API. The repo
already has an Expo shell (`../expo-app`) and a Capacitor shell (`../ios`)
from meeeyu; the same approach applies here.

## Going to production

### Supabase

1. Create a project and run `supabase/migrations/0001_voysnote.sql`. It
   sets up the tables, RLS, counters and storage buckets.
2. Enable the Apple and Google providers and email magic links
   (Authentication → Providers). Add `<site>/welcome?step=profile` to the
   redirect URLs.
3. Make yourself an admin: `update profiles set role = 'admin' where email = 'you@…';`
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY`.

When the `creators` table has rows, the app loads its catalog from Supabase
instead of the demo seed. Admin uploads go to Storage. Premium audio belongs
in the private `audio-premium` bucket, which only Plus members can read.

> The admin page is open to everyone in demo mode. With Supabase, writes are
> enforced by RLS (`profiles.role = 'admin'`); add a route guard before
> launch.

### Stripe

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and, optionally,
`STRIPE_PRICE_PLUS` (otherwise £5.99/month is created inline). Point a
webhook at `/api/stripe/webhook` for `checkout.session.completed` and
`customer.subscription.deleted`. The webhook verifies the signature and
writes `subscriptions`, `profiles.subscription_status` and
`series_purchases` with the service role.

### Monetisation hooks already modelled

- **Sponsored drops and series:** `sponsorId` on notes and series. They
  render as a quiet "Presented by …" line.
- **Paid series:** one-off or monthly, priced from £4.99 to £19.99.
- **B2B private channels:** sketched in the migration. Everything above
  can be scoped by a `channel_id` later.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint (Next + React Compiler rules)
npm run typecheck  # tsc --noEmit
```
