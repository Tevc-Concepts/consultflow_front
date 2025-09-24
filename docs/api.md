# API Layer & Demo Mode

The API client is defined in `shared/api/client.ts`. It returns an Axios instance configured based on the app's `demoMode` setting from the app store.

## Modes

- Demo mode (default):
  - Base URL is empty; requests to `/api/demo/*` are intercepted by a custom Axios adapter that returns data from `shared/data/demoDb.ts` and Next.js API routes under `app/api/demo/*`.
  - This allows the app to work offline and with deterministic demo data.
- Live mode:
  - Base URL uses `NEXT_PUBLIC_API_BASE_URL` and uses the default Axios adapter.
  - Future: attach `sid` or other auth headers in the request interceptor.

## Demo routes

Implemented under `app/api/demo/*`:
- `/api/demo/reports` and `/api/demo/reports/adjustments`
- `/api/demo/forecast`
- `/api/demo/tax-summary`
- `/api/demo/ai`

## Integrations

Adapter stubs live in `shared/api/integrations/*` for ERPNext, Sage, etc. These are placeholders that can be wired to real backends later.

## Error handling

- Basic try/catch is used in the adapter to fall back to the original Axios adapter when something unexpected happens.
- Callers should handle network errors, but demo mode should largely avoid them.
