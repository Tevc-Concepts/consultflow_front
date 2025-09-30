import { computePLFromTB } from '../accountingRepository';
import type { ChartOfAccount, TrialBalance } from '@entities/accounting/types';

describe('computePLFromTB', () => {
  it('computes revenue, cogs, opex and net income from TB + CoA', () => {
    const coa: ChartOfAccount[] = [
      { id: 'c-4000', companyId: 'c', accountCode: '4000', accountName: 'Revenue', accountType: 'Revenue', currency: 'NGN' },
      { id: 'c-5000', companyId: 'c', accountCode: '5000', accountName: 'COGS', accountType: 'Expense', currency: 'NGN' },
      { id: 'c-6000', companyId: 'c', accountCode: '6000', accountName: 'Opex', accountType: 'Expense', currency: 'NGN' }
    ];
    const tb: TrialBalance = {
      id: 'tb1', companyId: 'c', periodStart: '2025-08-01', periodEnd: '2025-08-31', uploadedBy: 'u', uploadedAt: new Date().toISOString(), status: 'approved',
      entries: [
        { accountCode: '4000', debit: 0, credit: 1000 },
        { accountCode: '5000', debit: 300, credit: 0 },
        { accountCode: '6000', debit: 200, credit: 0 }
      ]
    };
    const r = computePLFromTB(coa, tb);
    expect(r.revenue).toBe(1000);
    expect(r.cogs).toBe(0); // naive: cogs not inferred here unless inventory mapping
    expect(r.opex).toBe(500);
    expect(r.netIncome).toBe(500);
  });
});
