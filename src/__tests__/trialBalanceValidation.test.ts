import { accountingRepository } from '@shared/repositories/accountingRepository';
import type { TrialBalance, TrialBalanceEntry, TrialBalanceAdjustment } from '@entities/accounting/types';

// Helper to reset localStorage between tests (jsdom environment)
beforeEach(() => {
  localStorage.clear();
});

describe('Trial Balance validation & adjustments', () => {
  test('filters zero and parent account postings', () => {
    // Seed simple CoA: parent 1000 with child 1001
    const companyId = 'c1';
    const now = new Date().toISOString();
    accountingRepository.upsertCoA(companyId, [
      { id: 'a1', companyId, accountCode: '1000', accountName: 'Assets', accountType: 'Asset', currency: 'NGN', createdAt: now, updatedAt: now },
      { id: 'a2', companyId, parentAccountId: 'a1', accountCode: '1001', accountName: 'Cash', accountType: 'Asset', currency: 'NGN', createdAt: now, updatedAt: now }
    ] as any);

    const entries: TrialBalanceEntry[] = [
      { accountCode: '1000', debit: 0, credit: 0 }, // parent & zero
      { accountCode: '1001', debit: 500, credit: 0 }, // valid child
      { accountCode: '9999', debit: 0, credit: 0 } // zero line (also unmapped)
    ];

    const tb: TrialBalance = { id: 'tb1', companyId, periodStart: '2025-09-01', periodEnd: '2025-09-30', entries, uploadedBy: 'u1', uploadedAt: now, status: 'draft' } as any;
    accountingRepository.addTB(companyId, tb);

    const stored = accountingRepository.listTB(companyId)[0];
    // The repository itself does not filter; UI does. Simulate filtering like page.tsx
    const coa = accountingRepository.listCoA(companyId);
    const parentCodes = new Set(coa.filter(a => coa.some(c => c.parentAccountId === a.id)).map(a => a.accountCode));
    const filtered = stored.entries.filter(e => (e.debit !== 0 || e.credit !== 0) && !parentCodes.has(e.accountCode));

    expect(filtered).toHaveLength(1);
    expect(filtered[0].accountCode).toBe('1001');
  });

  test('computeAdjustedTotals aggregates correctly after adjustments & undo simulation', () => {
    const companyId = 'c2';
    const now = new Date().toISOString();
    accountingRepository.upsertCoA(companyId, [
      { id: 'b1', companyId, accountCode: '4000', accountName: 'Revenue', accountType: 'Revenue', currency: 'NGN', createdAt: now, updatedAt: now }
    ] as any);
    const tb: TrialBalance = { id: 'tb2', companyId, periodStart: '2025-09-01', periodEnd: '2025-09-30', entries: [{ accountCode: '4000', debit: 0, credit: 1000 }], uploadedBy: 'u1', uploadedAt: now, status: 'draft' } as any;
    accountingRepository.addTB(companyId, tb);

    // Add two adjustments (one debit, one credit)
    const adj1: TrialBalanceAdjustment = { id: 'adj1', tbId: 'tb2', accountCode: '4000', debit: 0, credit: 200, createdAt: now, createdBy: 'u1' } as any;
    const adj2: TrialBalanceAdjustment = { id: 'adj2', tbId: 'tb2', accountCode: '4000', debit: 50, credit: 0, createdAt: now, createdBy: 'u1' } as any;
    accountingRepository.addTBAdjustment(companyId, 'tb2', adj1);
    accountingRepository.addTBAdjustment(companyId, 'tb2', adj2);

    let current = accountingRepository.listTB(companyId).find(t => t.id === 'tb2')!;
    let totals = accountingRepository.computeAdjustedTotals(current);
    expect(totals.originalDebit).toBe(0);
    expect(totals.originalCredit).toBe(1000);
    expect(totals.adjDebit).toBe(50);
    expect(totals.adjCredit).toBe(200);
    expect(totals.netDebit).toBe(50);
    expect(totals.netCredit).toBe(1200);

    // Simulate undo of adj2 (debit)
    accountingRepository.deleteTBAdjustment(companyId, 'tb2', 'adj2');
    current = accountingRepository.listTB(companyId).find(t => t.id === 'tb2')!;
    totals = accountingRepository.computeAdjustedTotals(current);
    expect(totals.adjDebit).toBe(0);
    expect(totals.adjCredit).toBe(200);
    expect(totals.netDebit).toBe(0);
    expect(totals.netCredit).toBe(1200);
  });

  test('FX fallback flag triggers when missing rate', () => {
    const companyId = 'c3';
    const now = new Date().toISOString();
    accountingRepository.upsertCoA(companyId, [
      { id: 'c1', companyId, accountCode: '5000', accountName: 'Expense', accountType: 'Expense', currency: 'NGN', createdAt: now, updatedAt: now }
    ] as any);

    // Simulate UI mapping logic for a foreign currency line with no stored rate
    const entry: TrialBalanceEntry = { accountCode: '5000', debit: 100, credit: 0, currency: 'USD' as any };
    const baseCurrency = 'NGN';
    const periodEnd = '2025-09-30';
    const rateRec = accountingRepository.findRate(companyId, entry.currency as any, periodEnd);
    const rate = rateRec?.rate || 1;
    const fallbackUsed = !rateRec;
    const convertedDebit = Math.round(entry.debit * rate * 100) / 100;

    expect(fallbackUsed).toBe(true);
    expect(convertedDebit).toBe(100); // since rate=1 fallback
  });
});
