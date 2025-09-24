# Consultflow Frontend Architecture

This document explains how the Consultflow frontend is organized, the technology stack, and how data flows through the app.

## Stack overview

- Next.js 15 (App Router) + TypeScript
- TailwindCSS for styling and design tokens (gradients, soft shadows, rounded cards)
- Zustand for state management with LocalStorage-backed persistence in demo mode
- Axios for the API service layer with a demo-mode adapter that short-circuits to local data
- next-pwa for offline support (service worker + offline fallback)
- Framer Motion for subtle route and UI transitions

## Domain-driven structure

```
/src
 ├─ app/                 # Next.js routes, layouts, and API routes (App Router)
 ├─ components/          # Base UI atoms/molecules (design system primitives)
 ├─ shared/              # Cross-cutting: API client, demo data, components, state, hooks
 │   ├─ api/             # Axios client, integration adapters, repository helpers
 │   ├─ components/      # Reusable feature components (tables, widgets, panels)
 │   ├─ data/            # Demo DB and helpers to serve mock data
 │   ├─ hooks/           # Browser hooks (e.g., PWA install prompt)
 │   └─ state/           # Zustand stores (app, notifications, approvals, outbox)
 └─ styles/              # Global Tailwind styles
```

The code is separated by concerns:
- app: pages (routes) and API route handlers used for demo mode
- shared: reusable components, stores, and services used across features
- components/ui: small, reusable UI primitives (Button, Card, etc.)

## Routing

- Uses the Next.js App Router (server + client components mix)
- Pages include: `/`, `/dashboard`, `/reports`, `/client`, `/builder`, `/forecast`, `/compliance`, `/upload`, `/settings`, `/onboarding`, `/login`
- Demo API routes live under `/app/api/demo/*` and are called via the Axios client in demo mode

## Data flow

- Demo mode is controlled in `useAppStore` and persisted to LocalStorage
- The API layer (`shared/api/client.ts`) returns an Axios instance; in demo mode it swaps the adapter to return data from `shared/data/demoDb.ts` and the Next.js API routes
- Core global state lives in Zustand stores:
  - App-level preferences: role, currency, consolidation, company selection, onboarding flag
  - Notifications: ephemeral message list with persistence
  - Approvals: multi-step workflow + history per report key
  - Outbox: mock email queue used by the approvals flow
- Stores persist to LocalStorage with versioned keys; SSR guards are used where necessary

## Approvals workflow

- Implemented in `shared/state/approvals.ts`
- States: Draft → AccountantReview → ClientApproval → Approved or ChangesRequested → (optionally) Reopen
- Each transition appends an immutable history item
- Side-effects:
  - Adds a notification describing the transition
  - Optionally enqueues an email in the Outbox (send_to_client and approve)

## UI shell and design system

- Layout is driven by `app/layout.tsx` and an AppShell with sidebar and mobile nav
- UI primitives in `components/ui/*`
- Feature components in `shared/components/*` (tables, widgets, panels)
- Styling: Tailwind with brand palettes (Deep Navy, Forest Green, spectrum accents), gradients, soft shadows, rounded corners

## PWA

- Service worker registered by next-pwa
- Offline fallback page at `/public/offline.html`
- Icons and manifest under `/public` (see `docs/pwa.md` for details)

---

For more details on specific subsystems:
- State management: `docs/state.md`
- API layer and demo mode: `docs/api.md`
- UI & components: `docs/ui.md`
- PWA: `docs/pwa.md`
- Troubleshooting: `docs/troubleshooting.md`
