import { ChartOfAccount, TrialBalance, TaxTemplate, TrialBalanceEntry, CurrencyCode, TrialBalanceAdjustment, ExchangeRate, AuditEvent, JournalTransaction } from '@entities/accounting/types';

// LocalStorage keys
const KEYS = {
  COA: 'consultflow:accounting:coa:v1',
  TB: 'consultflow:accounting:tb:v1',
  TAX: 'consultflow:accounting:tax:v1',
  META: 'consultflow:accounting:meta:v1', // to map company relations
  MAP: 'consultflow:accounting:mapping:v1', // per-company saved mapping preferences
  FX: 'consultflow:accounting:fx:v1',
  AUDIT: 'consultflow:accounting:audit:v1',
  TXN: 'consultflow:accounting:txn:v1'
} as const;

type CoAMap = Record<string, ChartOfAccount[]>; // companyId -> CoA array
type TBMap = Record<string, TrialBalance[]>;    // companyId -> TB array
type TaxMap = Record<string, TaxTemplate[]>;    // companyId -> Tax templates
type MetaMap = Record<string, { chartOfAccounts?: string[]; trialBalances?: string[]; taxTemplates?: string[] }>; // companyId -> ids
type FxMap = Record<string, ExchangeRate[]>; // companyId -> rates
type AuditMap = Record<string, AuditEvent[]>; // companyId -> events
type TxnMap = Record<string, JournalTransaction[]>; // companyId -> transactions

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function writeLS<T>(key: string, value: T) {
  if (typeof window === 'undefined') return; try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Utilities
export function buildCoATree(items: ChartOfAccount[]): (ChartOfAccount & { children?: ChartOfAccount[] })[] {
  const byId = new Map(items.map(i => [i.id, { ...i, children: [] as ChartOfAccount[] }]));
  const roots: (ChartOfAccount & { children?: ChartOfAccount[] })[] = [];
  for (const item of byId.values()) {
    if (item.parentAccountId && byId.has(item.parentAccountId)) {
      (byId.get(item.parentAccountId)!.children as ChartOfAccount[]).push(item);
    } else {
      roots.push(item);
    }
  }
  // sort by accountCode
  const sortTree = (nodes: any[]) => { nodes.sort((a, b) => a.accountCode.localeCompare(b.accountCode)); nodes.forEach(n => n.children && sortTree(n.children)); };
  sortTree(roots);
  return roots;
}

export function validateCoA(items: ChartOfAccount[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const codes = new Set<string>();
  const ids = new Set<string>();
  items.forEach(acc => {
    if (!acc.accountCode) errors.push(`Missing accountCode for ${acc.accountName}`);
    if (codes.has(acc.accountCode)) errors.push(`Duplicate accountCode ${acc.accountCode}`); else codes.add(acc.accountCode);
    if (ids.has(acc.id)) errors.push(`Duplicate id ${acc.id}`); else ids.add(acc.id);
  });
  // validate parents
  const idSet = new Set(items.map(a => a.id));
  items.forEach(acc => { if (acc.parentAccountId && !idSet.has(acc.parentAccountId)) errors.push(`Missing parent for ${acc.accountCode} -> ${acc.parentAccountId}`); });
  return { ok: errors.length === 0, errors };
}

export function computePLFromTB(coa: ChartOfAccount[], tb: TrialBalance) {
  // Simple P&L sums by accountType
  const map = new Map<string, ChartOfAccount>();
  coa.forEach(a => map.set(a.accountCode, a));
  let revenue = 0, cogs = 0, opex = 0;
  tb.entries.forEach(e => {
    const acc = map.get(e.accountCode);
    const bal = e.debit - e.credit; // debit positive
    if (!acc) return;
    if (acc.accountType === 'Revenue') revenue += -bal; // revenues are credit balances
    else if (acc.accountType === 'Expense') opex += bal;
    else if (acc.accountType === 'Asset' && acc.accountName.toLowerCase().includes('inventory')) cogs += bal; // naive
  });
  const grossProfit = revenue - cogs;
  const netIncome = grossProfit - opex;
  return { revenue, cogs, opex, grossProfit, netIncome };
}

export class AccountingRepository {
  // mapping preferences
  getSavedMapping(companyId: string): Record<string, string> {
    const data = readLS<Record<string, Record<string, string>>>(KEYS.MAP, {});
    return data[companyId] || {};
  }
  saveMapping(companyId: string, mapping: Record<string, string>) {
    const data = readLS<Record<string, Record<string, string>>>(KEYS.MAP, {});
    data[companyId] = { ...(data[companyId] || {}), ...mapping };
    writeLS(KEYS.MAP, data);
  }

  // COA
  listCoA(companyId: string): ChartOfAccount[] {
    const data = readLS<CoAMap>(KEYS.COA, {}); return data[companyId] || [];
  }
  upsertCoA(companyId: string, items: ChartOfAccount[]) {
    const data = readLS<CoAMap>(KEYS.COA, {}); data[companyId] = items; writeLS(KEYS.COA, data);
    // update meta
    const meta = readLS<MetaMap>(KEYS.META, {});
    meta[companyId] = meta[companyId] || {};
    meta[companyId]!.chartOfAccounts = items.map(i => i.id);
    writeLS(KEYS.META, meta);
  }

  // TB
  listTB(companyId: string): TrialBalance[] { const data = readLS<TBMap>(KEYS.TB, {}); return data[companyId] || []; }
  addTB(companyId: string, tb: TrialBalance) {
    const data = readLS<TBMap>(KEYS.TB, {}); const arr = data[companyId] || []; arr.push(tb); data[companyId] = arr; writeLS(KEYS.TB, data);
    const meta = readLS<MetaMap>(KEYS.META, {}); meta[companyId] = meta[companyId] || {}; meta[companyId]!.trialBalances = arr.map(t => t.id); writeLS(KEYS.META, meta);
  }
  updateTBStatus(companyId: string, tbId: string, status: TrialBalance['status']) {
    const data = readLS<TBMap>(KEYS.TB, {}); const arr = data[companyId] || []; const idx = arr.findIndex(t => t.id === tbId); if (idx >= 0) { arr[idx].status = status; writeLS(KEYS.TB, data); }
  }
  updateTBEntries(companyId: string, tbId: string, entries: TrialBalanceEntry[]) {
    const data = readLS<TBMap>(KEYS.TB, {}); const arr = data[companyId] || []; const idx = arr.findIndex(t => t.id === tbId);
    if (idx >= 0 && arr[idx].status !== 'locked') { arr[idx].entries = entries; writeLS(KEYS.TB, data); }
  }
  addTBAdjustment(companyId: string, tbId: string, adj: TrialBalanceAdjustment) {
    const data = readLS<TBMap>(KEYS.TB, {}); const arr = data[companyId] || []; const tb = arr.find(t => t.id === tbId);
    if (tb && (tb.status === 'draft' || tb.status === 'pending_approval')) {
      tb.adjustments = tb.adjustments || [];
      tb.adjustments.push(adj);
      writeLS(KEYS.TB, data);
      this.logAudit(companyId, { id: `audit-${Date.now()}`, entity: 'adjustment', entityId: adj.id, action: 'create', timestamp: new Date().toISOString(), userId: adj.createdBy, meta: { tbId } });
    }
  }
  deleteTBAdjustment(companyId: string, tbId: string, adjId: string) {
    const data = readLS<TBMap>(KEYS.TB, {}); const arr = data[companyId] || []; const tb = arr.find(t => t.id === tbId);
    if (tb && tb.status !== 'locked' && tb.adjustments) {
      tb.adjustments = tb.adjustments.filter(a => a.id !== adjId);
      writeLS(KEYS.TB, data);
      this.logAudit(companyId, { id: `audit-${Date.now()}`, entity: 'adjustment', entityId: adjId, action: 'delete', timestamp: new Date().toISOString(), userId: 'system' });
    }
  }
  computeAdjustedTotals(tb: TrialBalance) {
    const base = tb.entries.reduce((acc, e) => { acc.debit += e.debit; acc.credit += e.credit; return acc; }, { debit: 0, credit: 0 });
    const adjs = (tb.adjustments || []).reduce((acc, a) => { acc.debit += a.debit; acc.credit += a.credit; return acc; }, { debit: 0, credit: 0 });
    return { originalDebit: base.debit, originalCredit: base.credit, adjDebit: adjs.debit, adjCredit: adjs.credit, netDebit: base.debit + adjs.debit, netCredit: base.credit + adjs.credit };
  }

  // Transactions
  listTransactions(companyId: string): JournalTransaction[] { return readLS<TxnMap>(KEYS.TXN, {})[companyId] || []; }
  addTransactions(companyId: string, txns: JournalTransaction[]) {
    const data = readLS<TxnMap>(KEYS.TXN, {}); data[companyId] = [...(data[companyId] || []), ...txns]; writeLS(KEYS.TXN, data);
    txns.forEach(t => this.logAudit(companyId, { id: `audit-${Date.now()}-${t.id}`, entity: 'transaction', entityId: t.id, action: 'create', timestamp: new Date().toISOString(), userId: t.createdBy }));
  }

  // FX
  listExchangeRates(companyId: string): ExchangeRate[] { return readLS<FxMap>(KEYS.FX, {})[companyId] || []; }
  upsertExchangeRate(companyId: string, rate: ExchangeRate) {
    const data = readLS<FxMap>(KEYS.FX, {}); const arr = data[companyId] || []; const idx = arr.findIndex(r => r.id === rate.id); if (idx >= 0) arr[idx] = rate; else arr.push(rate); data[companyId] = arr; writeLS(KEYS.FX, data);
  }
  deleteExchangeRate(companyId: string, rateId: string) {
    const data = readLS<FxMap>(KEYS.FX, {}); const arr = data[companyId] || []; data[companyId] = arr.filter(r => r.id !== rateId); writeLS(KEYS.FX, data);
  }
  findRate(companyId: string, target: CurrencyCode, date: string): ExchangeRate | undefined {
    const arr = this.listExchangeRates(companyId); return arr.find(r => r.target === target && r.date === date);
  }

  // Audit
  listAudit(companyId: string): AuditEvent[] { return readLS<AuditMap>(KEYS.AUDIT, {})[companyId] || []; }
  logAudit(companyId: string, evt: AuditEvent) {
    const data = readLS<AuditMap>(KEYS.AUDIT, {}); const arr = data[companyId] || []; arr.push(evt); data[companyId] = arr; writeLS(KEYS.AUDIT, data);
  }

  // TAX
  listTaxTemplates(companyId: string): TaxTemplate[] { const data = readLS<TaxMap>(KEYS.TAX, {}); return data[companyId] || []; }
  upsertTaxTemplates(companyId: string, items: TaxTemplate[]) {
    const data = readLS<TaxMap>(KEYS.TAX, {}); data[companyId] = items; writeLS(KEYS.TAX, data);
    const meta = readLS<MetaMap>(KEYS.META, {}); meta[companyId] = meta[companyId] || {}; meta[companyId]!.taxTemplates = items.map(t => t.id); writeLS(KEYS.META, meta);
  }

  getMeta(companyId: string) { const meta = readLS<MetaMap>(KEYS.META, {}); return meta[companyId] || {}; }

  // Seeding demo data for 2 companies
  seedDemo() {
    const seeded = readLS(KEYS.META + ':seeded', false as any as boolean);
    if (seeded) return;
    const now = new Date().toISOString();
    const companies = [
      { id: 'lagos-ng', currency: 'NGN' as CurrencyCode },
      { id: 'demo-us', currency: 'USD' as CurrencyCode }
    ];

    companies.forEach(c => {
      // Minimal CoA (Nigeria GAAP style subset)
      const coa: ChartOfAccount[] = [
        { id: `${c.id}-1000`, companyId: c.id, accountCode: '1000', accountName: 'Cash and Bank', accountType: 'Asset', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-1100`, companyId: c.id, accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'Asset', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-1200`, companyId: c.id, accountCode: '1200', accountName: 'Inventory', accountType: 'Asset', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-2000`, companyId: c.id, accountCode: '2000', accountName: 'Accounts Payable', accountType: 'Liability', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-3000`, companyId: c.id, accountCode: '3000', accountName: 'Share Capital', accountType: 'Equity', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-3100`, companyId: c.id, accountCode: '3100', accountName: 'Retained Earnings', accountType: 'Equity', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-4000`, companyId: c.id, accountCode: '4000', accountName: 'Revenue', accountType: 'Revenue', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-5000`, companyId: c.id, accountCode: '5000', accountName: 'Cost of Goods Sold', accountType: 'Expense', currency: c.currency, createdAt: now, updatedAt: now },
        { id: `${c.id}-6000`, companyId: c.id, accountCode: '6000', accountName: 'Operating Expenses', accountType: 'Expense', currency: c.currency, createdAt: now, updatedAt: now },
      ];
      this.upsertCoA(c.id, coa);

      // Tax templates defaults (Nigeria VAT 7.5%, PAYE 10%)
      const tax: TaxTemplate[] = [
        { id: `${c.id}-vat-7.5`, companyId: c.id, name: 'Nigeria VAT 7.5%', type: 'VAT', rate: 7.5, rules: { threshold: 0, exemptions: [] }, isDefault: true, createdAt: now, updatedAt: now },
        { id: `${c.id}-paye-10`, companyId: c.id, name: 'PAYE 10%', type: 'PAYE', rate: 10, rules: {}, isDefault: true, createdAt: now, updatedAt: now }
      ];
      this.upsertTaxTemplates(c.id, tax);

      // Trial balance for last month
      const today = new Date();
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
      const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).toISOString().slice(0, 10);
      const entries: TrialBalanceEntry[] = [
        { accountCode: '1000', debit: 5000000, credit: 0 },
        { accountCode: '1100', debit: 2000000, credit: 0 },
        { accountCode: '1200', debit: 1000000, credit: 0 },
        { accountCode: '2000', debit: 0, credit: 1500000 },
        { accountCode: '3000', debit: 0, credit: 3000000 },
        { accountCode: '3100', debit: 0, credit: 2000000 },
        { accountCode: '4000', debit: 0, credit: 8000000 },
        { accountCode: '5000', debit: 3000000, credit: 0 },
        { accountCode: '6000', debit: 1500000, credit: 0 },
      ];
      const tb: TrialBalance = { id: `${c.id}-tb-${start}`, companyId: c.id, periodStart: start, periodEnd: end, entries, uploadedBy: 'consultant-1', uploadedAt: now, status: 'approved' };
      this.addTB(c.id, tb);

      // Seed a couple of FX rates (base is company currency itself + one other just for demo)
      const fxDate = new Date().toISOString().slice(0,10);
      const fxBase: ExchangeRate = { id: `${c.id}-${c.currency}-${c.currency}-${fxDate}` , base: c.currency as CurrencyCode, target: c.currency as CurrencyCode, date: fxDate, rate: 1, createdAt: now };
      this.upsertExchangeRate(c.id, fxBase);
      if (c.currency !== 'USD') {
        const toUsd: ExchangeRate = { id: `${c.id}-${c.currency}-USD-${fxDate}`, base: c.currency as CurrencyCode, target: 'USD', date: fxDate, rate: 0.0012, createdAt: now } as any;
        this.upsertExchangeRate(c.id, toUsd);
      }
    });

    writeLS(KEYS.META + ':seeded', true as any);
  }
}

export const accountingRepository = new AccountingRepository();
