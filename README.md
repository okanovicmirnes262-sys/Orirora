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

## Mobile

The UI is designed for phones and adapts up to a 520px content column on
larger screens. It handles device safe areas (notch / home indicator), uses
16px form inputs to prevent iOS focus-zoom, and uses dynamic viewport units
(`dvh`) so browser chrome doesn't clip content.
