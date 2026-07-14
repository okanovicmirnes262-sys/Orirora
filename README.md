# ORDIORA — Restaurant OS

A mobile-first restaurant management app (reservations, shifts, team chat,
analytics) built with **React + Vite**, backed by **Supabase** (Postgres) so
data syncs across every device that opens the same restaurant.

## Features

- **Workspaces** — set up one or more restaurants, each with its own data.
- **Roles** — owner, waiter, chef, with role-scoped permissions.
- **Reservations** — create/edit bookings with table conflict detection.
- **Shifts** — weekly staff scheduling.
- **Chat** — general / floor / kitchen channels.
- **Analytics** — reservation trends, peak hours, status breakdown.
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

This build keeps the app's original account model: the owner creates staff and
the app generates each person's email and password, which the owner can view
and share. Because that "reveal & share the login" feature requires passwords
to be **recoverable**, they are stored as-is (not one-way hashed), and the
`kv_store` policy grants the `anon` key full access. This is fine for a demo or
internal tool, but for a public production deployment you should migrate
authentication to **Supabase Auth** (hashed passwords, email verification,
password reset) and tighten the Row Level Security policies accordingly. The
schema file documents this in more detail.

## Mobile

The UI is designed for phones and adapts up to a 520px content column on
larger screens. It handles device safe areas (notch / home indicator), uses
16px form inputs to prevent iOS focus-zoom, and uses dynamic viewport units
(`dvh`) so browser chrome doesn't clip content.
