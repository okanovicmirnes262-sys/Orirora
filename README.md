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

## Admin panel (`/admin`)

An internal support panel at `https://<your-domain>/admin` — restaurants,
their data and accounts, the error log, and a full history of admin edits.

- **Backend:** the `admin` Edge Function ([`supabase/functions/admin`](supabase/functions/admin/index.ts))
  plus the tables in [`supabase/migrations/20261027120000_admin_panel.sql`](supabase/migrations/20261027120000_admin_panel.sql).
  The function holds the service_role key; the browser only gets a 12-hour
  session token after the admin password is checked server-side (5 failed
  attempts per IP → 15-minute lockout).
- **Setup:** run the migration SQL in the Supabase SQL Editor, deploy the
  function, and set the secret `ADMIN_PASSWORD` (8+ characters) under
  Dashboard → Edge Functions → Secrets. Changing it signs out every admin session.
- **Error reporting:** the app sends JS errors, crashes and failed Supabase
  reads/writes to `error_logs` (anon may only insert), with the restaurant,
  user and screen attached. Users can also send a note via "Report a problem"
  (HelpBot and Settings).
- **Safety:** every data edit stores the previous value in `admin_history`
  and can be undone from the panel, including deleting a whole restaurant.
  "Sign in as owner" uses a one-time link valid for 2 minutes and shows a red
  admin-mode banner; edits made there are real.
- **Routing:** [`vercel.json`](vercel.json) rewrites every path to `index.html`
  so `/admin` works on Vercel; the admin code is lazy-loaded, so restaurants
  never download it.

## Mobile

The UI is designed for phones and adapts up to a 520px content column on
larger screens. It handles device safe areas (notch / home indicator), uses
16px form inputs to prevent iOS focus-zoom, and uses dynamic viewport units
(`dvh`) so browser chrome doesn't clip content.
