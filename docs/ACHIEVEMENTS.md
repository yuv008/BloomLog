# Bloomlog — End-to-End Achievement Document

**Last updated:** 20 May 2026  
**Latest production commit:** `958dc5c` (deployed to Vercel)  
**Production:** https://bloomlog-six.vercel.app  
**Repository:** https://github.com/yuv008/BloomLog  
**Supabase project:** `curzpvrglfdlujvffvex` (region: `ap-south-1`)

This document describes what has been built, how it works end-to-end, what was deployed, what was fixed in production, and what remains optional or incomplete.

---

## 1. Product vision

**Bloomlog** is a soft daily companion PWA: a “cozy room” for logging mood, water, mindful spending, meals, sleep, and tiny wins in about 60 seconds per day. Design principles:

- No streak pressure, no guilt copy
- Mood-as-weather visual language
- Gentle motion (Framer Motion) with reduced-motion support
- Works **offline-first** via `localStorage` when Supabase anonymous auth is unavailable
- Optional cloud sync when Supabase anonymous sign-in is enabled

---

## 2. Technology stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16.2 (App Router, React 19) |
| Styling | Tailwind CSS v4, custom design tokens (`globals.css`, `lib/theme/tokens.ts`) |
| Typography | Fraunces (display) + Inter (UI) |
| Motion | Framer Motion (`LazyMotion`, springs, reduced-motion guards) |
| State / data fetching | TanStack React Query v5, Zustand (UI micro-state) |
| Backend (optional) | Supabase (Postgres + Auth + RLS + Edge Functions) |
| PWA | `@ducanh2912/next-pwa` (service worker, offline fallback) |
| Analytics (optional) | PostHog with strict event allowlist |
| Deploy | Vercel (`bom1` region), GitHub integration |
| Forms / primitives | Radix UI (dialog, switch, tabs), custom `Button` / `Card` / `Sheet` |

---

## 3. Application routes & user journey

### 3.1 Entry & onboarding

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/dashboard` |
| `/landing` | Marketing-style landing (“join the soft list” / “open app”) |
| `/onboarding` | 3-step flow: welcome → optional name → room pick (windowsill / balcony / reading nook) |
| `/offline` | PWA offline fallback page |

**Onboarding completion** writes `users_profile` with `onboarding_complete: true` and updates React Query cache so the app layout does not loop back to step 1.

### 3.2 Main app (requires onboarding)

Wrapped by `(app)/layout.tsx`: max-width mobile shell, bottom nav when onboarding is complete, redirect to `/onboarding` if profile incomplete.

| Tab (nav) | Route | Primary purpose |
|-----------|-------|-----------------|
| **today** | `/dashboard` | Daily ritual: mood, water, spend, meals, sleep, quests, note |
| **garden** | `/garden` | Visual collection of decor earned from quests |
| **shelf** | `/shelf` | Memory polaroids / weekly recap previews |
| **recipes** | `/recipes`, `/recipes/[slug]` | Curated recipe nook (20 recipes) |
| — | `/settings` | Theme, notifications, finance toggle, export/delete data |

---

## 4. Features implemented (by area)

### 4.1 Today (`/dashboard`)

1. **Greeting header** — Time-aware greeting (“good morning”, etc.) with optional display name.

2. **Mood Sky**
   - 7 moods: sunny, cozy, dreamy, rainy, sleepy, golden hour, stormy
   - Carousel selection; background gradient + particle layer morph with mood
   - Persisted on `daily_entries.mood`

3. **Whispers**
   - 80-line static library (`lib/whispers/library.ts`)
   - Client picker with triggers (default, stormy, rainy, low water, monday, shelf, quest_streak)
   - **In-flow banner** at top of Today scroll (not `position: fixed`) so it does not cover mood/water controls
   - Max **one whisper per day**; **one fetch per visit** (`use-whisper` ref guard — no re-show on mood/water/quest changes)
   - Auto-dismiss after 5s or tap to close

4. **Water bottle**
   - Visual fill toward 2L goal; tap +250ml; long-press opens custom amount sheet
   - Petal burst animation at 100% goal
   - Optional `navigator.vibrate` on tap

5. **Spend bubbles + monthly view (single card)**
   - 6 categories: food, cafe, treats, travel, gifts, shopping
   - **Today:** floating bubble visualization; tap for polaroid-style detail; number wheel for amounts
   - Header shows `₹X today · no judgment`
   - **This month (collapsible):** divider below “+ log spend”; tap **“this month, softly”** to expand
   - Collapsed row shows month total hint (e.g. `₹4,830 across 3 places`) when data exists
   - Expanded: donut chart (`MonthlySpendPanel`) + category legend with % and ₹
   - `getExpensesForMonth()` aggregates by calendar month (Supabase range query or localStorage date keys)

6. **Meal polaroids**
   - Tag-based logging (no typing flow); optional photo URL field in schema
   - Timeline on dashboard

7. **Sleep tracker**
   - Circular dial UI; start/end times; quality (deep, okay, restless, stormy)
   - Stored on `daily_entries`

8. **Tiny quests**
   - Pool of 20 quests; deterministic daily pick of 3 per user/date
   - Completion triggers petal animation + **garden item reward** (see Garden)
   - Rare seed roll for rare decor items

9. **One-line note**
    - Optional daily note on `daily_entries.note`

### 4.2 Garden (`/garden`)

- **Room theme** from onboarding (windowsill / balcony / reading nook)
- **Shelf scene** with soft gradient and ledge
- **Empty state:** “your shelf is resting” + copy that tiny quests on Today add decor (no rush)
- **With items:** count line (“3 pieces from your gentle days”) + long-press hint for stories
- **Garden items** (8 types): sage bloom, blush rose, moon lamp, teacup, hanging light, fern, star jar, sleeping cat (some rare)
- Items positioned with `x`, `y`, `layer`; gentle float animation
- **Origin stories** via context menu / long-press (glass card overlay)
- `bloom_stage` field exists (0–3) but **progression over time is not yet implemented** — new items always start at stage 0

### 4.3 Memory shelf (`/shelf`)

- Polaroid stack UI for `memory_polaroids`
- “Preview a cozy polaroid” button seeds a sample `cozy_week` recap locally
- Supabase Edge Function `weekly_recap` exists for server-side recap generation (not fully wired to a one-tap UI in all environments)

### 4.4 Recipe nook (`/recipes`)

- **20 curated recipes** in `lib/recipes/data.ts` (static content, Pinterest-style grid)
- Individual recipe pages at `/recipes/[slug]`
- Sunday-surprise style selection can be extended; base grid is complete

### 4.5 Settings (`/settings`)

- **Day garden / Night garden** theme toggle (`next-themes`)
- **Cozy hour reminder** toggle + web push permission flow (`lib/notifications/push.ts`, `/api/push/subscribe`)
- **Finance enabled** toggle on profile
- **Export all data** as JSON download
- **Delete all data** with confirm → clears user data and returns to onboarding

### 4.6 PWA & landing

- Service worker + manifest in production build
- Offline document route
- Public landing page for alpha positioning

---

## 5. Design system & motion

- **Color tokens:** cream, beige, blush, sage, ink, whisper, etc. (`globals.css` + `lib/theme/tokens.ts`)
- **Surfaces:** `glass-card`, rounded corners (20–28px), soft shadows
- **Motion system:** `lib/motion` (springs, eases, variants, `use-reduced-motion`)
- **Components:** `Button`, `Card`, `Sheet`, layout primitives consistent across features

---

## 6. Data architecture

### 6.1 Dual storage model

```
┌─────────────────┐     ensureAuth()      ┌──────────────────┐
│  Browser client │ ────────────────────► │ Supabase Auth    │
└────────┬────────┘                       │ (anonymous)      │
         │                                 └────────┬─────────┘
         │ success: UUID userId                       │
         │ failure: guest_<uuid>                      │
         ▼                                          ▼
┌─────────────────┐                       ┌──────────────────┐
│  localStorage   │ ◄── fallback ──────── │ Postgres + RLS   │
│  bloomlog_*     │                       │ 8 tables         │
└─────────────────┘                       └──────────────────┘
```

**`lib/data/auth.ts`**

- Tries existing anonymous session → `signInAnonymously()`
- On failure (e.g. “Anonymous sign-ins are disabled”): `signOut()`, `guest_*` id, `sessionStorage` marks `local` mode
- `shouldUseSupabase(userId)` only true for real UUID + non-local auth source

**`lib/data/api.ts`**

- Single API surface for profile, daily entry, expenses (day + month), meals, quests, garden, polaroids, whispers
- Supabase attempt first when applicable; **always falls back to `localStore`** on error or guest mode
- React Query hooks in `hooks/use-bloom-data.ts` with `usePatchDailyCache`, `useMonthlyExpenses`, etc.
- `setQueryData` after mood/water writes for instant UI (avoids stale refetch overwriting local data)

### 6.2 Local storage keys (`bloomlog_` prefix)

| Key | Content |
|-----|---------|
| `guest_id` | Stable guest user id |
| `profile` | `UserProfile` |
| `daily` | `Record<date, DailyEntry>` |
| `expenses` | `Record<date, Expense[]>` |
| `meals` | `Record<date, Meal[]>` |
| `quests` | `Record<date, QuestCompletion[]>` |
| `garden` | `GardenItem[]` |
| `polaroids` | `MemoryPolaroid[]` |
| `whispers` | `WhisperLog[]` |

### 6.3 Supabase schema (`supabase/migrations/001_initial_schema.sql`)

| Table | Purpose |
|-------|---------|
| `users_profile` | Name, room, onboarding, notifications, finance toggle |
| `daily_entries` | Mood, water, sleep, note (unique per user/day) |
| `expenses` | Category + amount + date |
| `meals` | Tags, optional photo URL |
| `quest_completions` | Unique per user/day/quest_key |
| `garden_items` | Decor with JSON position + bloom_stage |
| `memory_polaroids` | Recap cards with payload JSON |
| `whispers_log` | Shown whisper keys |

All tables have **RLS** policies scoped to `auth.uid()`. Trigger `handle_new_user` creates profile row on signup.

### 6.4 Edge functions (Supabase)

| Function | Role |
|----------|------|
| `whisper_picker` | Server-side whisper selection logic |
| `weekly_recap` | Weekly memory polaroid generation |

These support cloud workflows; the client also runs whisper picking locally.

---

## 7. Analytics & privacy

- **PostHog** integrated with `autocapture: false` and an allowlist of events only:
  - `app_opened`, `onboarding_complete`, `mood_set`, `water_added`, `quest_completed`, `expense_logged`, `meal_logged`, `daily_checkin_complete`
- No PostHog key required for app to function
- Settings **export** / **delete** flows for user data control

---

## 8. Infrastructure & deployment

### 8.1 Vercel

- Project: `yuv008s-projects/bloomlog`
- Production URL: **https://bloomlog-six.vercel.app**
- Build: `npm run build` (webpack + PWA plugin)
- Region: `bom1` (`vercel.json`)

**Environment variables (as of last check):**

| Variable | Production | Development | Preview |
|----------|------------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ⚠️ may need manual add |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ⚠️ may need manual add |
| `NEXT_PUBLIC_APP_URL` | ✅ | — | — |

Preview env setup was interrupted in CLI (branch prompt); add via Vercel dashboard if preview deploys are used.

### 8.2 Supabase

- Project ref: `curzpvrglfdlujvffvex`
- URL: `https://curzpvrglfdlujvffvex.supabase.co`
- **Required manual step:** enable **Anonymous sign-ins** and add redirect URLs for production + localhost (see `README.md`)

Optional API route: `POST /api/setup/enable-anonymous` (needs `SUPABASE_ACCESS_TOKEN` + `SETUP_SECRET`) to enable anonymous auth via Management API.

### 8.3 Git history (main milestones)

| Commit | Summary |
|--------|---------|
| `f151c1b` | Initial full app implementation |
| `c0869f0` | Production URLs + Supabase auth setup docs |
| `20adb21` | Fix: localStorage path when anonymous auth fails |
| `6185ac5` | Fix: clear stale sessions, React Query cache updates, profile/onboarding loop |
| `ca52a42` | Monthly spend chart, garden empty-state copy, `docs/ACHIEVEMENTS.md` |
| `958dc5c` | In-flow whispers; monthly chart nested in spend card (collapsible) |

### 8.4 Developer tooling

- `.cursor/mcp.json` — Supabase + Vercel MCP servers
- `.cursor/PLUGINS.md` — plugin notes
- Scripts: `supabase:start`, `supabase:db:push`, `vercel:deploy:prod`

---

## 9. Production issues encountered & resolved

### 9.1 Symptom

“Nothing dynamic works” on deployed app — mood, water, quests appeared broken.

### 9.2 Root causes

1. **Anonymous sign-ins disabled** in Supabase → `signInAnonymously()` returned 422.
2. App used **guest IDs** but some paths still called Supabase with invalid IDs → 400 errors.
3. **Stale Supabase session cookies** could yield a UUID with no usable rows while local guest data existed.
4. **React Query** cached `null` profile/daily data; invalidation after writes could refetch empty Supabase rows and **overwrite** good local state.
5. **Onboarding loop:** completing onboarding did not update query cache → layout sent users back to step 1.

### 9.3 Fixes shipped (`20adb21`, `6185ac5`)

- Route reads/writes through `localStorage` when `shouldUseSupabase` is false
- `signOut()` on anonymous failure; persist `local` auth mode in `sessionStorage`
- Merge/fallback reads for guest profile and daily data
- `setQueryData` after mood/water writes; onboarding sets profile cache
- Layout waits for `isFetched` before redirecting to onboarding

### 9.4 Current behavior

- **Without** anonymous auth: full functionality in-browser via `localStorage` (per device).
- **With** anonymous auth enabled: sync to Supabase + RLS for multi-device persistence.

### 9.5 UI fixes (post-launch)

| Issue | Fix (`958dc5c`) |
|-------|------------------|
| Top whisper banner covered mood/water (fixed overlay) | `WhisperCard` moved in-flow; no `fixed` + high z-index |
| Whisper text kept changing on interactions | `useWhisper` runs once per visit; dismiss does not clear daily cap incorrectly |
| Monthly chart felt abrupt as second full card | Merged into `SpendBubblesCard` as collapsible “this month, softly” section |

---

## 10. End-to-end flows (reference)

### 10.1 First visit

```
Landing or /dashboard
  → ensureAuth (guest or anonymous)
  → layout: no profile / onboarding incomplete
  → /onboarding (3 steps)
  → upsertProfile(onboarding_complete)
  → /dashboard + bottom nav
```

### 10.2 Daily check-in (~60s)

```
Set mood → upsert daily_entries
Add water → upsert water_ml
Optional: log spend, meal, sleep
Complete tiny quest → quest_completions + random garden_item
Optional: one-line note
Optional: expand "this month, softly" inside spend card
Whisper may appear once (in-flow, top of Today)
```

### 10.3 Garden reward

```
completeQuest()
  → rare roll (deterministic hash)
  → randomGardenReward()
  → addGardenItem() with position
  → visible on /garden
```

### 10.4 Monthly finance view

```
User taps "this month, softly" in spend card
  → getExpensesForMonth(userId, yyyy-MM)  [useMonthlyExpenses hook]
  → aggregateExpensesByCategory()
  → MonthlySpendPanel (donut + legend, animated expand)
```

---

## 11. What is not yet complete / optional

| Item | Status |
|------|--------|
| Supabase anonymous auth enabled in dashboard | **Manual** — required for cloud sync |
| Preview Vercel env vars | **Partial** — add via dashboard |
| `bloom_stage` progression (seed → bloom over days) | Schema only; UI uses stage 0 |
| PostHog key in production | Optional; not configured by default |
| R2 meal photo uploads | Env placeholders in `.env.example`; not wired |
| Custom domain `bloomlog.app` | Landing copy references it; DNS not documented here |
| Alpha study (15 users × 4 weeks) | Process documented in README; not automated |
| Edge functions wired to shelf “generate recap” for all users | Partial; local preview button exists |
| iOS/Android native push (APNs/FCM) | Web push only in V2 scope |

---

## 12. Environment variables reference

See `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_PROJECT_REF=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_APP_URL=
R2_*  # optional meal storage
```

Local development: copy to `.env.local` (gitignored).

---

## 13. How to verify everything works

1. **Local:** `npm install && npm run dev` → http://localhost:3000  
2. Complete onboarding → dashboard interactions (mood, +250ml, quest, spend).  
3. **Garden:** complete a quest → item appears; empty state shows guidance copy.  
4. **Month chart:** log spends → open spend card → expand “this month, softly”.  
5. **Whispers:** at most one gentle line per day; should not block taps on mood/water.  
6. **Production:** hard-refresh https://bloomlog-six.vercel.app (or incognito; clear PWA cache if stale).  
7. **Supabase:** enable anonymous sign-ins + redirect URLs → new sessions sync to DB without redeploy.

---

## 14. Key source files (quick reference)

| Area | Files |
|------|--------|
| Auth / guest fallback | `src/lib/data/auth.ts` |
| Data API | `src/lib/data/api.ts` |
| Local storage | `src/lib/storage/local.ts` |
| Today page | `src/app/(app)/dashboard/page.tsx` |
| Spend + month UI | `src/components/finance/spend-bubbles.tsx`, `monthly-spend-chart.tsx` |
| Whispers | `src/hooks/use-whisper.ts`, `src/components/whispers/whisper-card.tsx` |
| Garden | `src/components/garden/garden-room.tsx` |
| Achievements doc | `docs/ACHIEVEMENTS.md` |

---

## 15. Summary

Bloomlog is a **production-deployed PWA** (https://bloomlog-six.vercel.app, commit `958dc5c`) with a complete **daily ritual loop** (mood, water, finance with today + collapsible month view, food, sleep, quests), a **reward garden** with guided empty states, **memory shelf**, **recipe nook**, **settings/export/delete**, and a **dual-layer data system** (Supabase + localStorage) resilient to auth misconfiguration.

Shipped fixes include guest-mode data routing, React Query cache updates, onboarding loop prevention, non-blocking whispers, and integrated monthly spend UX. Remaining work is mainly **operational** (enable Supabase anonymous auth, preview env vars), **content/ops** (alpha study), and **nice-to-have** features (bloom stage progression, R2 meal photos, full edge-function recap wiring).

---

*For setup commands and links, see the root [README.md](../README.md). For the product roadmap and phased ideas, see [ROADMAP.md](./ROADMAP.md).*
