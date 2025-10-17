# Accounting Uploads & Adjustments (CoA, Trial Balance, Transactions)

This document describes the enhanced workflow for managing a client's Chart of Accounts (CoA), Trial Balance (TB), and Journal Transactions, including multi‑currency support and post‑upload adjustments.

## 1. Chart of Accounts (CoA)
Fields:
- accountCode, accountName, accountType, parentAccountCode (optional), currency (inferred from company base)

Upload template: `accountCode,accountName,accountType,parentAccountCode`

Validation performed client-side: unique `accountCode` & `id`, valid parent references.

## 2. Trial Balance
### Data Model Enhancements
`TrialBalanceEntry` now includes optional `currency`, `originalDebit`, `originalCredit` for multi‑currency source values (if different from base).
`TrialBalance` includes `currency` (base) and `adjustments: TrialBalanceAdjustment[]`.

Adjustment structure:
```
{
  id, tbId, accountCode, debit, credit, reason?, createdAt, createdBy
}
```

### Workflow Statuses
`draft -> pending_approval -> approved -> locked`
- Draft: consultant can edit lines & add/delete adjustments.
- Pending approval: awaiting reviewer sign‑off; still can add adjustments if needed (optionally restrict later).
- Approved: can lock; still can add adjustments until locked (future enhancement: restrict to reversal journals only).
- Locked: read‑only (no entry or adjustment changes).

### Balancing Logic
Net Debit/Credit = (Sum original entries) + (Sum adjustments). UI displays net totals & balance check ✓ / ⚠︎.

### Upload Template (updated)
`accountCode,name,debit,credit,currency`

If `currency` omitted, base currency assumed and original* fields are not stored.

### Inline Editing
During initial upload (before save) user can edit debit/credit numbers directly in the grid. After saving (draft created) further edits should be implemented via an edit view (future enhancement — currently adjustments can be used).

## 3. Adjustments
Quick add via the \"Adj\" button (temporary UX): prompts for account, debit, credit, reason. Stored in `tb.adjustments`. Summaries appear under period row.

Future improvements:
- Dedicated modal with validation (cannot set both debit & credit).
- Track user & reversal flag.
- Export audit trail.

## 4. Journal Transactions
New page: `/consultant/companies/[id]/transactions` supports upload & preview.
Template (updated):
`date,accountCode,description,debit,credit,currency`

Parser: supports CSV/XLSX; rows with both debit & credit zero are ignored (future improvement). Source flagged as `upload`.

## 5. CSV Templates Endpoint
`/api/local/upload/template?type=trial_balance|transactions|coa|...` now returns updated headers with `currency` column for trial balance & transactions.

## 6. Reporting Impact
`computeAdjustedTotals(tb)` utility returns original + adjustment aggregates for UI and future report consolidation.

## 7. Next Enhancements (Suggested)
- Robust adjustment management (edit/delete individual adjustments with audit).
- Multi-currency conversion using exchange rates table (store rate & base equivalent on entry).
- Transaction persistence & linkage to TB periods for drill‑down.
- Validation: forbid posting to parent summary accounts if desired.
- Batch mapping review screen for unresolved account codes.

## 7a. Implemented Enhancements (Post Initial Draft)
The following roadmap items have been delivered:
- Adjustment management: add, edit, delete with undo (add/edit/delete) via modal + expandable TB row.
- FX conversion: TB entries & transactions convert to base currency; original amounts + rate stored. Fallback warning banner appears if missing rate (assumed 1.0).
- Transaction persistence: uploaded transactions saved; period filter UI; FX fallback warning.
- Audit logging: adjustments and transactions generate audit events (local-only for now) + audit viewer page.
- Undo system: maintains stack for adjustment add/edit/delete (replay actions to revert state).
- Exchange Rate Management UI: CRUD page to add/edit/delete per-company rates (base/target/date).
- Reports Drill‑Down: consolidated report account rows open a transaction drawer across selected companies (CSV export supported).
- Validation Filters: zero-amount lines and postings to parent (summary) accounts removed on TB save with user alert.
- Rate Caching Stub: in‑memory helper (`rateCache.ts`) enabling last‑known lookup (future external fetch integration point).
- Expanded Tests: validation (zero & parent filter), adjustment aggregation, FX fallback scenario.

### Client CRUD & Transparency (Consultant role)
- Clients page now supports consultant-side CRUD for:
  - Documents: create, review (approve/reject), history view per item.
  - Reports: create/submit/approve with history.
  - Support tickets: create/resolve and history.
- Interaction History: local-first log stored via repository (mirrors an audit trail) and visible per item (📜 History).

### Trial Balance Transaction Drill-Down
- From the Trial Balance page, you can drill down to transactions by account within a TB period:
  - “Txns” on adjustments and on each account in the accounts table.
  - Drawer includes date range and source filters plus CSV export of visible rows.

## 8. Permissions & Status Rules
| Status | Edit Entries | Add/Edit Adj | Delete Adj | Lock Allowed | Notes |
|--------|--------------|--------------|------------|--------------|-------|
| draft | Yes (initial upload) | Yes | Yes | No | Primary working state |
| pending_approval | (future: limited) | Yes | Yes | Yes (Approve first) | Used for review |
| approved | No | No (future: restrict) | No | Yes (Lock) | Adjustments now frozen |
| locked | No | No | No | N/A | Immutable snapshot |

Currently adjustments allowed in draft & pending_approval; repository enforces no changes once locked.

## 9. Testing
Added Jest tests for:
- Trial balance CSV parsing (currency + original amounts)
- Transactions CSV parsing
- Empty row handling

Run tests: `npm test`

## 10. Future Items Still Open
- Automatic rate fetching from external FX provider (integrate into `fetchAndCacheRate`).
- Period-aware transaction drill‑down filters (date range & journal type selectors).
- Lock-state restriction refinements (block adjustments post-approval, allow only reversing journals).
- Enhanced mapping assistance (fuzzy suggestions & batch resolve with AI hints).
- Bulk adjustment import & export (CSV template for adjustments).
- Direct journal entry creation & linking to TB periods.
- Multi-level consolidation eliminations editor (currently mocked percentages).

## 11. Developer Notes
Primary files touched:
- `src/entities/accounting/types.ts`
- `src/shared/repositories/accountingRepository.ts`
- `src/app/consultant/companies/[id]/trial-balance/page.tsx`
- `src/app/consultant/companies/[id]/transactions/page.tsx`
- `src/shared/utils/uploadParsers.ts`
- `src/app/api/local/upload/template/route.ts`
- `src/features/reports/components/ConsolidatedReportsView.tsx` (drill‑down)
- `src/app/consultant/companies/[id]/exchange-rates/page.tsx`
- `src/app/consultant/companies/[id]/audit/page.tsx`
- `src/shared/utils/rateCache.ts`

Search for `TrialBalanceAdjustment` or `JournalTransaction` for integration points.

