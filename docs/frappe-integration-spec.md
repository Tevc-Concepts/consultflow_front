## Consultflow x Frappe/ERPNext Integration Spec (v1)

This document defines how to implement a complete Backend-as-a-Service on Frappe Framework 15+ (ERPNext optional) for the existing Consultflow frontend (Next.js App Router). It maps current frontend data shapes, routes, and services to Frappe/ERPNext doctypes, API endpoints, background jobs, and real-time notifications.

Audience: Frappe developer(s) who will build/ship the backend. Outcome: the frontend can switch NEXT_PUBLIC_DATA_SOURCE=frappe and work end-to-end.

Key references
- Frontend API client: `src/shared/api/frappe.ts` and `src/shared/api/client.ts`
- Frontend types: `src/entities/*/types.ts`
- Reports UI: `src/app/reports/page.tsx`, `src/shared/components/*Table.tsx`, `@features/reports/services/liveDataService.ts`


## Stack, versions, and principles

- Frappe Framework: 15.x
- ERPNext: 15.x (recommended for standard financial reports, GL, COA, taxes)
- Backend app: `consultflow` (custom app for additional doctypes/methods)
- Auth: Frappe session cookie (sid) via `/api/method/login` with CORS + credentials; optionally API key/secret for server-to-server
- Transport: Frappe REST `/api/resource/*` and RPC `/api/method/*`
- Async: `frappe.enqueue` jobs + Redis Queue (RQ)
- Realtime: `frappe.publish_realtime` over Socket.IO channels; Notifications via Notification Log and optional Web Push
- Files: `/api/method/upload_file`


## Roles and permissions

Create two custom roles to match the frontend’s UX, in addition to existing ERPNext roles:
- Consultant (custom)
- Client (custom)

Role mapping used by the frontend (`features/auth/service.ts`):
- Admin ⇔ Administrator
- Accountant ⇔ Accounts Manager / Accountant
- Consultant ⇔ Consultant (custom)
- Client ⇔ Client (custom)

Grant access rules:
- Consultant: read/write on consolidation config, adjustments, report snapshots, client sharing, import jobs; read companies/accounts/GL/reports
- Accountant: read/write on adjustments, approvals, tax, bank reconciliation
- Client: read-only access to shared report snapshots and comment/approve
- Admin: full


## Doctypes

Leverage standard ERPNext doctypes, and add these custom doctypes in the `consultflow` app.

Standard (ERPNext):
- Company, Account, Journal Entry, GL Entry, Currency Exchange, Cost Center, Department
- Bank Account, Bank Transaction, Payment Entry (for reconciliation flows)
- Notification Log, Email Queue, File

Custom (Consultflow):
1) Company Group
   - name (Auto)
   - title (Data)
   - description (Small Text)
   - companies (Table) → Company Group Company { company (Link Company), weight (Float) }
   - reporting_currency (Select)
   - active (Check)

2) Consolidation Rule
   - name (Auto)
   - group (Link Company Group)
   - type (Select: elimination | adjustment | mapping)
   - source_account (Link Account)
   - target_account (Data or Link Account)
   - factor (Float, default 1.0)
   - conditions (JSON)

3) Report Adjustment
   - name (Auto)
   - company (Link Company)
   - report_type (Select: profit_loss | balance_sheet | cash_flow | trial_balance)
   - account (Link Account)
   - account_code (Data)
   - account_name (Data)
   - amount (Currency)
   - reason (Small Text)
   - status (Select: draft | pending_approval | approved | rejected)
   - created_by (Link User)
   - approved_by (Link User)
   - approved_at (Datetime)

4) Report Snapshot
   - name (Auto)
   - company (Link Company)
   - company_group (Link Company Group)
   - report_type (Select: profit_loss | balance_sheet | cash_flow | trial_balance | consolidated)
   - period_start (Date)
   - period_end (Date)
   - currency (Select)
   - is_consolidated (Check)
   - data (Long Text JSON)
   - metadata (Long Text JSON)  // audit trail, filters
   - created_by (Link User)

5) Approval
   - name (Auto)
   - key (Data) // matches frontend approval key e.g. reports:pl:<company or ALL>:<range>
   - status (Select: Draft | AccountantReview | ChangesRequested | ClientReview | Approved)
   - history (Long Text JSON) // array of actions with timestamp/user/comment
   - current_owner (Link User)

6) Web Push Subscription
   - name (Auto)
   - user (Link User)
   - endpoint (Data)
   - p256dh (Data)
   - auth (Data)
   - user_agent (Data)
   - created_from_ip (Data)

7) Compliance Task
   - name (Auto)
   - company (Link Company)
   - task_type (Select: VAT | PAYE | WHT | CIT | Other)
   - due_date (Date)
   - period_start (Date)
   - period_end (Date)
   - payload (Long Text JSON) // prefilled data, amounts
   - status (Select: pending | scheduled | filed | paid | closed)
   - reminders (Table: date, channel, sent)

8) External Connector
   - name (Auto)
   - provider (Select: ERPNext | QuickBooks | Xero | Sage)
   - company (Link Company)
   - config (Long Text JSON) // tokens, base_url, scopes
   - enabled (Check)


## API endpoints and contracts

Conventions
- Resource CRUD: `/api/resource/<Doctype>` (Frappe default)
- RPC methods: `/api/method/<python.path>`
- All responses should return a consistent shape for frontend adapters:
  `{ success: boolean, data?: any, message?: string, errors?: object }`
  Note: Frappe wraps data under `message` or `data`; the frontend `frappe.ts` already unwraps.

Authentication
- Login: `POST /api/method/login` with `usr`, `pwd` (form or JSON); set cookie `sid`. CORS must allow credentials from the frontend origin.
- Logout: `POST /api/method/logout`
- Session ping: `GET /api/method/frappe.auth.get_logged_user` or a lightweight `consultflow.api.ping`
- Optional: API Key/Secret for server-to-server via `Authorization: token api_key:api_secret`

Important: The current frontend mistakenly attaches `Authorization: token <sid>`. Prefer cookie-based auth; keep CORS/CSRF correctly configured. If token auth is desired, issue an API key/secret per user and return it once, then the frontend can store and use it instead of `sid`.


### Users & profiles

- Get current user: `GET /api/method/frappe.auth.get_logged_user`
- User preferences (custom mapping to frontend `User.preferences`):
  - Doctype: extend via a child table or use `User` custom fields: `cf_currency`, `cf_theme`, `cf_notifications_json`, `cf_dashboard_json`.
  - RPC: `GET /api/method/consultflow.user.get_preferences`
  - RPC: `POST /api/method/consultflow.user.set_preferences` (body: preferences JSON)

Response shape to match `src/entities/user/types.ts`:
```
{
  id, email, full_name, role, avatar?, created_at, updated_at, is_active,
  preferences: { currency, theme, notifications: { email,push,in_app }, dashboard: { default_view, default_period } }
}
```


### Companies & groups

- List companies: `GET /api/resource/Company?fields=["name","company_name","default_currency","country","date_of_establishment"]&filters={"disabled":0}`
  - Frontend expects `CompanyData` with `id`, `name`, `currency`, `fiscal_year_start`, `fiscal_year_end`, `is_active`.
  - Provide a convenience RPC to shape data: `GET /api/method/consultflow.company.list`
  - Single company: `GET /api/resource/Company/<name>` or `GET /api/method/consultflow.company.get?name=<name>`

- Company Group CRUD: `/api/resource/Company Group`
- Consolidation Rule CRUD: `/api/resource/Consolidation Rule`


### Chart of Accounts, GL, and transactions

- Chart of Accounts: `GET /api/resource/Account?filters={"company":"<Company>","is_group":0,"disabled":0}&fields=["name","account_name","account_type","parent_account","is_group","account_number"]` — map to `FinancialAccount`
- General Ledger (per account):
  - Option A (preferred): `GET /api/method/frappe.desk.query_report.run` with `report_name=General Ledger` and filters `{ company, from_date, to_date, account }`
  - Option B (utility): `POST /api/method/erpnext.accounts.utils.get_gl_entries` with `{ company, from_date, to_date, account }` if available in your version

Normalize GL results to `TransactionDetail` used in drill-down:
```
{ id, date, reference, description, debit, credit, balance, created_by }
```


### Financial statements (single entity)

Run standard ERPNext reports via their execute paths or query_report API:
- Profit & Loss:
  - RPC: `POST /api/method/erpnext.accounts.report.profit_and_loss_statement.profit_and_loss_statement.execute`
  - Filters: `{ company, from_date, to_date, periodicity?, presentation_currency? }`
- Balance Sheet:
  - RPC: `POST /api/method/erpnext.accounts.report.balance_sheet.balance_sheet.execute`
  - Filters: `{ company, as_on_date, periodicity?, presentation_currency? }`
- Cash Flow:
  - RPC: `POST /api/method/erpnext.accounts.report.cash_flow.cash_flow.execute`
  - Filters: `{ company, from_date, to_date, presentation_currency? }`

Provide wrappers with stable response shapes under your app:
- `POST /api/method/consultflow.reports.profit_loss`
- `POST /api/method/consultflow.reports.balance_sheet`
- `POST /api/method/consultflow.reports.cash_flow`

Wrappers can:
- Simplify parameters
- Attach exchange rate snapshots
- Return `sections`, `line_items`, and `totals` in the structure matching `src/entities/report/types.ts`


### Consolidated reporting (multi-company)

Implement a server-side consolidation endpoint to avoid heavy client aggregation and to support elimination entries and FX translation consistently.

- RPC: `POST /api/method/consultflow.reports.consolidated`
  - Body: `{ company_ids: string[], group?: string, from_date: string, to_date: string, presentation_currency?: string }`
  - Behavior:
    - Fetch P&L and Balance Sheet per company (ERPNext reports)
    - Translate to presentation currency using Currency Exchange or your FX policy
    - Apply `Consolidation Rule` entries (eliminations and mappings)
    - Aggregate into a unified tree (optionally by account type)
    - Return `ConsolidatedData`:
```
{
  companies: [{ id, name, currency, fiscal_year_start, fiscal_year_end, is_active }],
  consolidated_accounts: DrillDownData[],
  elimination_entries: [{ description, debit_account, credit_account, amount }],
  total_revenue, total_expenses, net_income
}
```

Optional: expose ERPNext’s “Consolidated Financial Statement” report if available, or keep logic in `consultflow.reports.consolidated`.


### Adjustments

The frontend’s `AdjustmentsPanel` currently hits demo endpoints. Implement real endpoints backed by `Report Adjustment` doctype:
- List: `GET /api/method/consultflow.adjustments.list?companies=<comma-sep>` → `{ items: ReportAdjustment[] }`
- Create: `POST /api/method/consultflow.adjustments.create` → `{ ok: true, item }`
- Delete: `DELETE /api/method/consultflow.adjustments.delete?id=<name>` → `{ ok: true }`

Apply via server when generating reports or snapshots (e.g., include approved adjustments in totals and line items). Maintain an audit trail in `metadata.audit_trail` for `Report Snapshot`.


### Approvals workflow

Add REST for the lightweight approvals used in `src/shared/state/approvals.ts` analog:
- Get/Init: `GET /api/method/consultflow.approvals.get?key=<key>` → `{ key, status, history: [] }`
- Transition: `POST /api/method/consultflow.approvals.transition` → `{ key, status, history }`

Use Frappe Workflow if you want a strict model, but the above RPCs are enough and match the frontend keying strategy.


### Report Builder & Snapshots

- Create snapshot after generating a report: `POST /api/resource/Report Snapshot`
- List snapshots for a company/group: `GET /api/resource/Report Snapshot?filters=...`
- Share to client: create a `Portal Share` (or a simple signed link) and a Notification Log entry. Alternatively create a custom `Shared Report` doctype with access keys.


### Tax & compliance

Provide prefilled compliance forms and a calendar with reminders.

- Prefill data RPC: `GET /api/method/consultflow.compliance.prefill?company=<name>&type=<VAT|PAYE|WHT|CIT>&period_start&period_end`
- Create a `Compliance Task` with the payload: `POST /api/resource/Compliance Task`
- Reminder scheduler: enqueue daily to create `Notification Log` entries and optionally push via Web Push

Where possible, reuse ERPNext taxes settings for VAT etc. The RPC should compute bases/amounts from GL/Tax reports.


### Bank sync (mock) & reconciliation

- CSV/Excel upload: use `/api/method/upload_file` to attach to a new server-side Import Job, then `frappe.enqueue` background parse/map
- Doctype to store parsed lines (optional): `Bank Import Line` or reuse ERPNext `Bank Transaction`
- Reconciliation UI can consume `Bank Transaction` list + suggest matches; provide RPC `consultflow.bank.reconcile_suggestions` and `consultflow.bank.apply_reconciliation`


### Client portal: sharing, comments, approvals

- Comments: use standard `Comment` doctype linked to `Report Snapshot`
- Sharing: `Portal Share` or a custom doctype with `allow_guest` signed link
- Approvals: integrate the `Approval` doctype transitions; notify via Notification Log


### Files

- Upload: `POST /api/method/upload_file` (supports `doctype` and `docname` for linking)


### Notifications and messaging

Channels
- In-app: `Notification Log` + realtime via `frappe.publish_realtime(event='consultflow_notification', message={...}, user=...)`
- Email: `Email Queue` (Frappe email doctype)
- Web Push: custom `Web Push Subscription` + VAPID keys; server pushes to endpoints via pywebpush

Endpoints
- Subscribe Web Push: `POST /api/method/consultflow.notifications.subscribe` { endpoint, p256dh, auth }
- Send notification: `POST /api/method/consultflow.notifications.send` { to_user, title, message, kind, action? }
- Outbox processing: create `Outbox` entries mapped to Email Queue or Notification Log (optional)

Queues
- Use `frappe.enqueue` for heavy work (imports, consolidations, push fan-out). Tag queues e.g., `long`, `default`.


### AI Assistant (demo)

- RPC: `POST /api/method/consultflow.ai.ask` { prompt, mode?: 'CEO'|'CFO'|'Accountant', context?: {...} }
- Returns: { answer, highlights: string[], references?: any[] }
- Implementation: can be a deterministic templated summary over the provided report filters for demo; optionally integrate with an LLM provider (respecting security keys via Site Config)


## Data shape mapping (frontend ↔ backend)

User (`src/entities/user/types.ts`)
- id ⇔ `User.name`
- full_name ⇔ `full_name`
- role ⇔ derived from `Roles` (map as in auth service)
- preferences ⇔ custom fields or separate RPC storing JSON

Company (`src/entities/company/types.ts`)
- id ⇔ `Company.name`
- name ⇔ `company_name`
- currency ⇔ `default_currency`
- fiscal_year_end ⇔ from ERPNext Fiscal Year or Company custom field; expose start/end in RPC

FinancialAccount (`src/entities/financial/types.ts`)
- map to ERPNext `Account` (use `name` as id, `account_number` as code)

TransactionDetail (drill-down)
- derived from GL entries: name/voucher_no, posting_date, remarks, debit, credit, running balance (compute)

FinancialReport (`src/entities/report/types.ts`)
- Build from ERPNext report outputs; place totals under `ReportTotals`. Keep `data.sections` and `line_items` keyed by account.


## Security, CORS, and session

- Allow CORS with credentials for the frontend origin (Vercel domain and localhost):
  - `allow_cors` hostnames
  - `Access-Control-Allow-Credentials: true`
- Use cookie `sid` for browser auth; set `SameSite=None; Secure` for HTTPS
- CSRF: Frappe manages CSRF for form posts; RPCs from same origin + credentials are fine
- Rate limits: add `@rate_limit` or nginx/proxy level for `/api/method/*`
- Audit logging: log transitions in `Report Snapshot.metadata.audit_trail` and `Approval.history`


## Background jobs and schedules

Jobs
- Import parse/map (bank CSV/Excel, trial balances) → create lines, attempt fuzzy mapping to COA
- Consolidated report generation (snapshot for a period) → cache for fast loads
- Notification fan-out (web push + email)

Schedules (cron)
- Daily at 08:00: compliance reminders
- Hourly: FX rates fetch if `auto_fx_rates` enabled (use standard ERPNext Exchange Rate or custom method)


## Implementation checklist (backend agent)

1. Create app `consultflow`, install with ERPNext 15
2. Add doctypes listed above with permissions by role
3. Implement RPCs:
   - `consultflow.api.ping`
   - `consultflow.user.get_preferences`, `consultflow.user.set_preferences`
   - `consultflow.company.list`, `consultflow.company.get`
   - `consultflow.reports.profit_loss`, `balance_sheet`, `cash_flow`, `consolidated`
   - `consultflow.reports.drilldown` (optional helper for one account)
   - `consultflow.adjustments.list|create|delete`
   - `consultflow.approvals.get|transition`
   - `consultflow.compliance.prefill`
   - `consultflow.bank.reconcile_suggestions|apply_reconciliation`
   - `consultflow.notifications.subscribe|send`
   - `consultflow.ai.ask`
4. Ensure `/api/resource` CRUD works for the custom doctypes
5. Configure CORS and cookies for the frontend origin
6. Validate with the frontend using `NEXT_PUBLIC_DATA_SOURCE=frappe`


## Frontend alignment notes

- `frappe.ts` currently sets `Authorization: token <sid>`; prefer cookie-based auth. Optionally return API key/secret to the frontend and change the header to `token api_key:api_secret`.
- `liveDataService.getCompanies()` expects fields `id`, `name`, `currency`, `fiscal_year_start|end` — provide the shaping RPC `consultflow.company.list`.
- Drill-down currently calls `getDoc('Account', code)` and GL utils. Provide a stable `consultflow.reports.drilldown` that returns `DrillDownData` directly to reduce round-trips.
- Consolidation is computed client-side today; moving it server-side will produce consistent FX + elimination behavior.


## Example payloads

Profit & Loss request
```
POST /api/method/consultflow.reports.profit_loss
{ "company": "TechFlow Nigeria Ltd", "from_date": "2025-01-01", "to_date": "2025-03-31", "periodicity": "Monthly", "presentation_currency": "NGN" }
```

Consolidated request
```
POST /api/method/consultflow.reports.consolidated
{ "company_ids": ["TechFlow Nigeria Ltd","East Africa Logistics Co"], "from_date": "2025-01-01", "to_date": "2025-03-31", "presentation_currency": "USD" }
```

Adjustments create
```
POST /api/method/consultflow.adjustments.create
{ "company": "TechFlow Nigeria Ltd", "report_type": "profit_loss", "account": "4000 - Sales - TFN", "account_code": "4000", "account_name": "Sales", "amount": 75000, "reason": "Intercompany elimination" }
```


## Real-time and push

- Publish in-app notifications:
  - `frappe.publish_realtime("consultflow_notification", { id, title, message, kind, ts }, user=user.name)`
- Web Push: store subscriptions; send via worker job using VAPID keys


## Deployment & environment

- Site Config:
  - `host_name`, `developer_mode` (dev), SMTP settings, Redis cache/queue
  - CORS allowlist for your frontend domains
  - VAPID keys if using Web Push
  - Optional LLM keys for AI endpoint

- Frontend env:
  - `NEXT_PUBLIC_DATA_SOURCE=frappe`
  - `NEXT_PUBLIC_API_BASE_URL=https://your-frappe-site`


## Success criteria (what to test)

- Login returns cookie `sid`; `authService.login` stores session
- `/reports` loads companies from `consultflow.company.list`
- P&L/BS/CF load for a single company via consultflow wrappers
- Drill-down returns transactions via a single RPC
- Consolidated reports return unified totals + elimination entries
- Adjustments can be created/listed/deleted and reflected in reports
- Approvals transitions persist and appear in the UI
- Compliance tasks list with upcoming reminders generated by scheduler
- File upload works for CSV; an import job is enqueued and status can be polled
- Notifications appear in-app; optional Web Push delivers to the browser


## Roadmap (optional)

- OAuth connectors for QuickBooks/Xero; populate `External Connector`
- Data warehouse snapshotting for faster time-series KPIs
- Fine-grained permissions per Client vs Consultant per company
- Report Builder blocks stored as JSON and rendered in the frontend builder


---
Questions or need clarifications? Keep this spec close to the code and update alongside backend implementation. This document is designed to be a prompt for an autonomous Frappe agent to implement the backend end-to-end.
