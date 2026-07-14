# ORDIORA — Restaurant OS

A mobile-first restaurant management app (reservations, shifts, team chat,
analytics) built with **React + Vite**. Single-page, no backend — all data is
stored locally in the browser via `localStorage`.

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
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Data & privacy

All state (accounts, reservations, shifts, chat, settings) lives in the
browser's `localStorage` under the `restaurantos:*` key namespace. Clearing
site data resets the app. No data leaves the device.

## Mobile

The UI is designed for phones and adapts up to a 520px content column on
larger screens. It handles device safe areas (notch / home indicator), uses
16px form inputs to prevent iOS focus-zoom, and uses dynamic viewport units
(`dvh`) so browser chrome doesn't clip content.
