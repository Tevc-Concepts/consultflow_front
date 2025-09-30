import { ChartOfAccount, TrialBalance, TrialBalanceEntry, TaxTemplate, AccountType, CurrencyCode } from '@entities/accounting/types';
import { accountingRepository } from './accountingRepository';
import { frappeApi } from '@shared/api/frappe';

export type AccountingMode = 'local' | 'frappe';

class AccountingService {
  private mode: AccountingMode = (process.env.NEXT_PUBLIC_DATA_SOURCE as AccountingMode) || 'local';

  setMode(mode: AccountingMode) { this.mode = mode; }
  getMode() { return this.mode; }

  // Chart of Accounts
  async listCoA(companyId: string): Promise<ChartOfAccount[]> {
    if (this.mode === 'local') return accountingRepository.listCoA(companyId);
    // Frappe: fetch accounts and map
    const items = await frappeApi.getChartOfAccounts(companyId);
    return items.map((row: any) => ({
      id: row.name,
      companyId,
      accountCode: row.name, // Frappe Account name typically acts as code; adjust if you expose 'account_number'
      accountName: row.account_name || row.name,
      accountType: (row.account_type || 'Asset') as AccountType,
      parentAccountId: row.parent_account || undefined,
      currency: 'NGN' as CurrencyCode, // TODO: fetch company default currency
      isActive: true
    }));
  }

  async upsertCoA(companyId: string, items: ChartOfAccount[]): Promise<void> {
    if (this.mode === 'local') return accountingRepository.upsertCoA(companyId, items);
    // Frappe: creating a full CoA via API is non-trivial; skip for now
    throw new Error('Frappe upsertCoA not supported in demo');
  }

  // Trial Balance
  async listTB(companyId: string): Promise<TrialBalance[]> {
    if (this.mode === 'local') return accountingRepository.listTB(companyId);
    // Frappe: derive TB from GL for last 1-2 months (demo)
    const today = new Date();
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
    const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).toISOString().slice(0, 10);
    const gl = await frappeApi.getGeneralLedger({ company: companyId, from_date: from, to_date: to });
    const byAccount = new Map<string, { debit: number; credit: number; name?: string }>();
    gl.forEach((e: any) => {
      const k = e.account;
      const cur = byAccount.get(k) || { debit: 0, credit: 0, name: e.account_name };
      cur.debit += Number(e.debit || 0);
      cur.credit += Number(e.credit || 0);
      byAccount.set(k, cur);
    });
    const entries: TrialBalanceEntry[] = Array.from(byAccount.entries()).map(([code, v]) => ({ accountCode: code, name: v.name, debit: v.debit, credit: v.credit }));
    return [{ id: `${companyId}-tb-${from}`, companyId, periodStart: from, periodEnd: to, entries, uploadedBy: 'frappe', uploadedAt: new Date().toISOString(), status: 'approved' }];
  }

  async addTB(companyId: string, tb: TrialBalance): Promise<void> {
    if (this.mode === 'local') return accountingRepository.addTB(companyId, tb);
    // Frappe: storing TB directly not supported; would require a custom DocType
    throw new Error('Frappe addTB not supported');
  }

  async updateTBStatus(companyId: string, tbId: string, status: TrialBalance['status']): Promise<void> {
    if (this.mode === 'local') return accountingRepository.updateTBStatus(companyId, tbId, status);
    throw new Error('Frappe TB status update not supported');
  }

  // Tax Templates
  async listTaxTemplates(companyId: string): Promise<TaxTemplate[]> {
    if (this.mode === 'local') return accountingRepository.listTaxTemplates(companyId);
    const rows = await frappeApi.getTaxTemplates();
    return rows.map((r: any) => ({ id: r.name, companyId, name: r.title || r.name, type: 'VAT', rate: 0, rules: {} }));
  }

  async upsertTaxTemplates(companyId: string, items: TaxTemplate[]): Promise<void> {
    if (this.mode === 'local') return accountingRepository.upsertTaxTemplates(companyId, items);
    throw new Error('Frappe upsertTaxTemplates not supported');
  }

  // Mapping preferences shared
  getSavedMapping(companyId: string) { return accountingRepository.getSavedMapping(companyId); }
  saveMapping(companyId: string, mapping: Record<string, string>) { return accountingRepository.saveMapping(companyId, mapping); }
}

export const accountingService = new AccountingService();
export default accountingService;
