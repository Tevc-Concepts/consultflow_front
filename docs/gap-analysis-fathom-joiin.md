# Consultflow vs Fathom & Joiin — Feature Gap Analysis (Sept 2025)

This document inventories prominent capabilities advertised by Fathom and Joiin, maps them to the current Consultflow frontend, and lists concrete gaps with suggested actions. Focus areas include Nigeria Tax Authority (FIRS/State IRS) 2025 compliance UI, client approval flow for final reports, subscription/service payments, and AI commentary/analysis.

## Snapshot

- Benchmarks
  - Fathom: Management reporting, deep analysis & KPIs, three-way forecasting, multi-entity consolidation, templates, scheduling, collaboration, exports.
  - Joiin: Multi-entity consolidation, report packs, dashboards, AI insights, intercompany eliminations, FX/multi-currency, COA mapping, user management, integrations, mobile.
- Current Consultflow (from repo structure and docs)
  - Next.js App Router, PWA ready, Tailwind + shadcn/ui, framer-motion
  - Pages: Auth (mock), Dashboard, Reports (P&L/BS/CF), Forecast (basic), Report Builder, Compliance (demo), Upload & mapping (demo), Settings & integrations (toggles), Client portal (basic), Presentations export (PDF demo), AI widget (mock), Notifications (basic), Offline support

Status key
- Present: exists in code with a usable flow
- Partial: demo/skeleton or missing depth/edge cases
- Missing: not present

---

## 1) Reporting & Report Packs
- What Fathom/Joiin offer
  - Drag-and-drop report editor, content library, 90+ charts, auto-text placeholders, branded report templates, custom templates, scheduled reports, access control, draft vs published, comments on reports, presentation mode, export (PDF/Excel/CSV/images), variance reporting (actual vs budget/LY), consolidated reports and report packs, AI-generated summaries (Joiin), mobile-ready.
- Consultflow now
  - Report pages for P&L/BS/CF (Present - basic)
  - Report Builder page (Partial - limited components)
  - PDF export demo (Partial)
  - AI widget present globally (Partial for report-level commentary)
  - Client portal basic share (Partial)
- Gaps
  - Content library of charts/tables/financial statements (Missing)
  - Branded templates/themes & custom templates save/load (Missing)
  - Auto-text placeholders (periods, company names, dynamic KPIs) (Missing)
  - Scheduled report generation & email delivery (Missing)
  - Report states: draft/published with versioning (Missing)
  - In-report comments/annotations and discussion threads (Partial → Missing depth)
  - Variance modes: Actual vs Budget, vs Last Year, vs Target (Partial)
  - Excel/CSV export of data tables and images export for charts (Partial)
  - Presentation mode (full-screen, page-safe) with keyboard nav (Partial)
  - Access control per report and shareable links with permissions (Missing)

Suggested actions
- Build a reusable Report Pack model with: layout schema, slide/section blocks, theme, metadata, versioning, publish status
- Add component library: KPI cards, statement tables, charts, narrative blocks, auto-text
- Implement variance modes and compare selectors in `ReportTable`
- Add export adapters (PDF via html2canvas/jspdf, CSV/Excel for tables, PNG for charts)
- Introduce scheduled jobs UI (frontend scheduler + backend hook), email templating, and presentation mode polish

---

## 2) Analysis & KPIs
- What Fathom/Joiin offer
  - KPI library (50+ financial KPIs), custom KPI builder with formula editor, non-financial KPIs, targets, alerts, ranking/benchmarking across entities, divisional/tracking category analysis, profitability, cash flow visualisations, trend analysis, goalseek, global search with transactional drill-down.
- Consultflow now
  - KPI cards on dashboard (Present - basic)
  - Drill-down rows in reports (Partial)
  - AI widget for explanations (Partial)
- Gaps
  - KPI library and reusable KPI definitions (Missing)
  - Custom KPI builder + formula editor (Missing)
  - KPI targets and alerting (Missing)
  - Benchmarking/ranking across entities (Missing)
  - Divisional/tracking category views (classes, locations, jobs) (Missing)
  - Profitability/growth/trend analysis modules (Partial/Missing)
  - Goalseek/scenario-style drivers in analysis (Missing)
  - Global search and transactional drill-down explorer (Missing)

Suggested actions
- Create `@entities/kpi` with definitions, formulas, targets, alerts
- Add KPI builder UI and evaluation engine; persist in local/demo API
- Add multi-entity comparison & ranking views
- Introduce a global search panel with transaction drill-down (mocked dataset first)

---

## 3) Forecasting (Three-way)
- What Fathom/Joiin offer
  - Three-way forecasts (P&L, BS, CF), driver-based, microforecasts, scenarios, rolling forecasts, assumptions, audit trails, long-term (36 months), forecasts from budgets, consolidated forecasts, integrated reporting.
- Consultflow now
  - Forecast page (Partial – basic demo)
- Gaps
  - Driver-based forecasting, scenario management (best/base/worst) (Missing)
  - Microforecasts (one-off events like hires/assets) (Missing)
  - Rolling forecast automation & from-budget bootstrap (Missing)
  - Assumptions & audit trail UI (Missing)
  - Consolidated forecasts (Missing)

Suggested actions
- Define forecast engine (demo) with drivers, scenarios, and micro-events
- Build assumptions panel and change log
- Integrate forecast outputs back into Report Packs and variance views

---

## 4) Consolidation & Multi-entity
- What Fathom/Joiin offer
  - Multi-entity consolidation, intercompany eliminations, adjustments, consolidated budgets, COA mapping, multi-currency FX conversions with custom rates, quick sync to subs, non-financial consolidation.
- Consultflow now
  - Multi-entity consolidation UI (Partial)
  - Demo integrations and toggles (Partial)
- Gaps
  - COA mapping UI and persistence (Missing)
  - Intercompany eliminations workflow (Missing)
  - Adjustments journal at group level (Missing)
  - Multi-currency conversions and custom FX rates (Missing)
  - Consolidated budgets and Actual vs Consolidated Budget (Missing)
  - Non-financial KPI consolidation (Missing)

Suggested actions
- Add `@features/consolidation` with COA mapper, eliminations, adjustments, FX settings
- Provide demo data and flows to validate UI

---

## 5) Integrations & Data
- What Fathom/Joiin offer
  - Native integrations (Xero, QuickBooks, Sage, MYOB, Pennylane, spreadsheets, Google Sheets), API connectors for BI tools; Excel Add-ins; fast sync and scheduling.
- Consultflow now
  - `@shared/api/integrations` for ERPNext/Sage (Partial – demo)
  - CSV/Excel upload & mapping (Present – demo)
- Gaps
  - Connector surfaces for QuickBooks, Xero, Google Sheets (Mock acceptable for demo) (Missing)
  - Scheduled sync setup, status & logs (Missing)
  - Excel/Google Sheets add-in equivalent (Out of scope frontend-only; document placeholder) (Missing)

Suggested actions
- Expand integrations page with mock connectors and sync status
- Add background sync scheduler UI and logs (front-end demo)

---

## 6) Collaboration, Approvals, Access Control
- What Fathom/Joiin offer
  - Share access, granular permissions, comments, draft/publish, scheduled sharing, view-only links.
- Consultflow now
  - Client portal (Partial)
  - Components: `ApprovalStatusBadge`, `ApprovalTimeline` (Partial)
- Gaps
  - End-to-end approval flow for final reports (request → review → approve/reject → lock with audit trail) (Partial → Missing depth)
  - Role-based access control on reports, packs, and clients (Missing)
  - Shareable links with view-only and expiry (Missing)
  - Email notifications for requests/comments (Missing)

Suggested actions
- Implement approval state machine and UI hooks in Report Packs
- Add simple ACL model in frontend store with demo policies
- Wire notifications pane to approval events

---

## 7) AI Insights & Commentary
- What Fathom/Joiin offer
  - AI summaries and insights in report packs; anomaly/trend surfacing; “Observation” blocks that auto-comment based on rules.
- Consultflow now
  - `AIWidget` (Present – mocked) with Q&A
- Gaps
  - Per-report AI narrative sections (executive summary, CFO/CEO perspective) (Missing)
  - Rule-based observations (auto-positive/negative comments) (Missing)
  - Anomaly detection callouts on KPIs and line items (Missing)

Suggested actions
- Add “AI Commentary” block for Report Packs with modes (CEO/CFO/Accountant)
- Implement simple rule engine to generate observations (demo rules + thresholds)

---

## 8) Nigeria Tax Authority (FIRS/State IRS) 2025 Compliance
- What best-in-class peers don’t cover (your advantage)
  - Localised tax forms: VAT monthly returns, WHT schedules, PAYE (state) remittances, CIT annual returns summary
  - Compliance calendar with reminders, pre-fill from ledgers, exportable filings summary
- Consultflow now
  - `app/compliance` page (Partial – demo data)
- Gaps
  - Form-specific UIs with validation and pre-fill (VAT, WHT, PAYE, CIT) (Missing)
  - Jurisdiction selection (FIRS vs State IRS for PAYE) and periodization (Missing)
  - Filing status tracker, due dates, penalties reminders (Missing)
  - Export packs for filings (PDF/CSV) and client approval before submit (Missing)

Suggested actions
- Build dedicated form components under `features/tax-ng/` (demo schemas)
- Add compliance calendar with reminders and status
- Integrate approval flow to lock exported filings for client sign-off

---

## 9) Subscription/Service Payments
- What Fathom/Joiin offer
  - Pricing plans, free trials, user/entity limits; typically Stripe/Braintree; invoices & receipts.
- Consultflow now
  - No payments surfaced (Missing)
- Gaps
  - Subscription plans (tiers, entity/user limits) (Missing)
  - Payment provider integration (Stripe/Paystack/Flutterwave for NG) (Missing)
  - Billing history, invoices/receipts UI (Missing)
  - Feature gating by plan (Missing)

Suggested actions
- Add `features/billing` with plan selector, payment checkout (choose Paystack/Flutterwave for Nigeria demo), and entitlements in app state
- Gate advanced features (e.g., consolidation, report packs, scheduling) by plan

---

## 10) Security & Notifications
- What Fathom/Joiin offer
  - MFA, granular permissions, secure hosting, activity notifications
- Consultflow now
  - Notifications UI (Partial – demo), auth (mock)
- Gaps
  - MFA UX (Out of scope frontend-only; mockable) (Missing)
  - Permissions per entity/report/feature (Missing)
  - Email/push notifications for events (approvals, schedules) (Missing)

Suggested actions
- Add a simple role/permission model at frontend with demo seeds
- Extend notifications to key flows (approval requested, comment added, report ready)

---

## 11) Exports & Scheduling
- What Fathom/Joiin offer
  - Scheduled generation & delivery; export to PDF/Excel/CSV; images for charts; presentation mode
- Consultflow now
  - PDF demo export, presentation slides (Partial)
- Gaps
  - Scheduling UI and run history (Missing)
  - Consistent CSV/Excel exports for all tables (Partial)
  - Chart image export (Missing)

Suggested actions
- Add a unified export service and scheduling UI under `@shared`

---

## 12) Mobile & PWA
- What Fathom/Joiin offer
  - Mobile-friendly reports and dashboards
- Consultflow now
  - PWA + responsive components (Present)
- Gaps
  - Touch-friendly drill-down interactions and slide navigation polish (Partial)

Suggested actions
- Audit touch targets, add gesture support for slides and drill-downs

---

## Priority Roadmap (90-day demo scope)
1) Report Packs v1 (templates, blocks, export, presentation); Approval flow; AI commentary block
2) Consolidation essentials: COA mapping, eliminations, FX settings (demo)
3) Compliance NG v1: VAT, WHT, PAYE, CIT forms with prefill + calendar + approval-to-export
4) Billing: Plans, Paystack/Flutterwave checkout mock, plan gating
5) KPI library + custom KPI builder (minimal); Variance modes and compare UI
6) Scheduling (reports + emails) and notifications for approvals

---

## Requirements coverage mapping
- Nigeria compliance UI: Deferred until 1) Report Packs v1 foundation (forms will be separate) → Planned in milestone 3
- Approval flow: Core scope for milestone 1
- Subscription/service payments: Core scope for milestone 4
- AI comment/analysis of report: Core scope for milestone 1 (AI blocks + rules)

---

## Notes
- Some features (MFA, Excel/Sheets add-ins, transactional drill-down connected to real ledgers) require backend or desktop add-ins; we’ll ship UI demos and stubs.
- Keep files modular per domain (`features/`, `entities/`, `shared/`), maintain < 300 LOC per file, and ensure accessibility.
