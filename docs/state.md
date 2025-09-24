# State Management

Zustand is used for lightweight, composable global stores. Each store is kept small and focused, and most are persisted to LocalStorage with SSR guards.

## Stores

- App store (`shared/state/app.ts`)
  - Keys: `consultflow:app:v1`
  - State: demoMode, role, reportingCurrency, consolidated, selectedCompanyIds, onboardingComplete, fx
  - API: setters for each field; `persist()` keeps a minimal slice

- Notifications store (`shared/state/notifications.ts`)
  - Keys: `consultflow:notifications:v1`
  - Items: { id, title, message?, kind, ts, read?, action? }
  - API: add, dismiss, markRead, clear

- Approvals store (`shared/state/approvals.ts`)
  - Keys: `consultflow:approvals:v1`
  - Types: ApprovalState, ApprovalAction, ApprovalHistoryItem, Workflow
  - API: getOrInit, getStatus, getHistory, transition, reset, clearAll
  - Side-effects: emits notifications; enqueues Outbox items for key transitions

- Outbox store (`shared/state/outbox.ts`)
  - Keys: `consultflow:outbox:v1`
  - Item: { id, to, subject, body?, href?, status: 'queued' | 'sent', ts }
  - API: enqueue, markSent, remove, clear

## Patterns

- Persistence: Each store uses a versioned key and tries/catches to avoid SSR failures
- UI integration: Stores are consumed in client components; some expose `.getState()` for cross-store side-effects
- Limits: Notification and history arrays are truncated to keep memory small
