# Consultflow Frontend

Production-ready Next.js 15 + TypeScript app with TailwindCSS, Zustand, Axios, Framer Motion, and next-pwa. Includes demo-mode data, offline support, and core Consultflow workflows (dashboard, reports, approvals, client portal, builder, forecasting, tax/compliance).

Explore detailed docs in `docs/`:

- Architecture: `docs/architecture.md`
- Features overview: `docs/features.md`
- State management: `docs/state.md`
- API & demo mode: `docs/api.md`
- UI & design system: `docs/ui.md`
- PWA behavior: `docs/pwa.md`
- Troubleshooting: `docs/troubleshooting.md`

## Prerequisites

- Node.js 18+ and npm 9+

## Install

```bash
npm install
```

## Run the dev server

```bash
npm run dev
```

### Data source switching (demo | sqlite | frappe)

The app can switch between three data sources without changing UI code:

- demo: in-memory demo data (no API calls)
- sqlite: local SQLite-backed API routes (Next.js server) under `/api/local/*`
- frappe: external backend; base URL from `NEXT_PUBLIC_API_BASE_URL`

Configure via `.env`:

```
NEXT_PUBLIC_DATA_SOURCE=sqlite
NEXT_PUBLIC_API_BASE_URL=
LOCAL_SQLITE_PATH=.data/consultflow.db
```

You can also change it at runtime from the sidebar selector. When `sqlite` is active, the first request will auto-create and seed a small database at `.data/consultflow.db`.

Visit http://localhost:3000

## Build for production

```bash
npm run build
npm start
```

## Lint

```bash
npm run lint
```

## Project structure

```
src/
  app/
    layout.tsx       # Top-level layout (globals, shell, motion)
    page.tsx         # Landing page
    api/demo/*       # Demo APIs for offline mode
  components/ui/     # Design system primitives (Button, Card, Modal, KPI, BrandBadge)
  shared/
    api/             # Axios client, integration stubs
    components/      # Feature components (ReportTable, ApprovalTimeline, OutboxPanel, etc.)
    data/            # Demo DB helpers
    hooks/           # Browser hooks (PWA install prompt)
    state/           # Zustand stores (app, notifications, approvals, outbox)
  styles/
    globals.css      # Tailwind directives + design tokens
```

## Notes

- Demo mode is enabled by default (toggle in Settings). API requests to `/api/demo/*` are handled locally.
- The app is PWA-enabled with an offline fallback (`/offline.html`) and app icons under `/public/icons`.
- Approvals are persisted locally with history and notifications; key transitions enqueue mock emails in the Outbox.
