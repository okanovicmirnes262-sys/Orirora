# ORDIORA — Restaurant OS

A mobile-first restaurant management app (reservations, shifts, team chat,
analytics) built with **React + Vite**, backed by **Supabase** (Postgres) so
data syncs across every device that opens the same restaurant.

## Features

- **Workspaces** — set up one or more restaurants, each with its own data.
- **Roles** — owner, waiter, chef, with role-scoped permissions.
- **Access & recovery** — sign in with the exact restaurant name + password
  (the restaurant list is never shown). Passwords are stored one-way hashed
  (PBKDF2 · SHA-256), never in plaintext. The owner can reset any staff member's
  password (the new one is shown once), and can reset their own via a recovery
  code (shown at setup, viewable in Settings) using "Forgot password?" on the
  sign-in screen.
- **Reservations** — create/edit bookings with table conflict detection.
- **Shifts** — weekly staff scheduling.
- **Chat** — general / floor / kitchen channels.
- **Analytics** — reservation trends, peak hours, status breakdown.
- **Order supplies** — build a supplier order from a goods catalog, set
  quantities in kom / kg / L, and export a CSV table (opens in Google Sheets /
  Excel) or draft an email to the supplier. Populate the catalog by snapping a
  photo of a menu (OCR) or importing a PDF, with an editable review step.
- **Light / dark** theme.

## Getting started

```bash
npm install
# configure Supabase first (see below), then:
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Supabase setup (required)

The app needs a Supabase project to run. It's free and takes a couple of
minutes:

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This
   creates the `kv_store` table and its access policy.
3. Go to **Project Settings → API** and copy your **Project URL** and the
   **`anon` public** key.
4. Copy `.env.example` to `.env` and paste both values:
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```
5. Start the app: `npm run dev`.

Until `.env` is filled in, the app shows a setup screen instead of running.

## How data is stored

Shared data (the restaurant registry plus each restaurant's accounts, tables,
reservations, shifts, chat, and notifications) is written to Supabase as JSON
documents in the `kv_store` table, keyed under the `restaurantos:*` namespace.
Every device that opens the same restaurant reads and writes the same rows, so
changes sync across devices.

A few things stay **device-local** in `localStorage` by design: the selected
restaurant, the "remember me" session, and the light/dark theme.

## Security

The owner creates staff and the app generates each person's email and password.
Passwords are **one-way hashed** (PBKDF2 · SHA-256 with a per-account salt, via
the Web Crypto API) — they are never stored in plaintext, so a generated
password is shown **once** at creation/reset and cannot be viewed again, only
reset. Any legacy plaintext passwords from older data are migrated to hashes
automatically the first time that restaurant's data loads.

Still open for a public production deployment: the `kv_store` policy grants the
`anon` key full access, so you should migrate authentication to **Supabase Auth**
(email verification, server-side password reset) and tighten the Row Level
Security policies accordingly. The schema file documents this in more detail.
Password hashing requires a secure context (https or localhost).

## Subscription gate (Whop)

Using the app requires an **active Whop subscription** — but clients never sign in
with Whop. Login stays **restaurant name + password**; the only Whop touchpoint is a
one-time checkout. After subscribing, the owner pastes their **license key** once on
the paywall; a serverless function (`api/whop/*`) validates it against Whop with the
server-side `WHOP_API_KEY`, and the result is cached on the restaurant record
(`{ license, entitledUntil }`) so staff and every later login need nothing. Access is
re-checked on load, so a cancelled subscription loses access.

Setup (owner):
1. In Whop, for the plan (`WHOP_PLAN_ID`), enable **license keys** and get your **API key**.
2. In the app's **Vercel project → Environment Variables**, set `WHOP_API_KEY` and
   `WHOP_PLAN_ID` (see `.env.example`), then redeploy. These are server-side only and
   never reach the browser.
3. Confirm the exact Whop license-validation endpoint for your account; override it with
   `WHOP_VALIDATE_URL` if it differs from the v2 default in `api/whop/activate.ts`.

Note: this gate stops the normal bypass, but the app is still a client-side SPA whose
Supabase anon key ships in the bundle with open RLS — a technically skilled person could
reach the data directly. Fully airtight access control means moving data behind
authenticated server endpoints and tightening RLS (a larger, separate step).

## Mobile

The UI is designed for phones and adapts up to a 520px content column on
larger screens. It handles device safe areas (notch / home indicator), uses
16px form inputs to prevent iOS focus-zoom, and uses dynamic viewport units
(`dvh`) so browser chrome doesn't clip content.
