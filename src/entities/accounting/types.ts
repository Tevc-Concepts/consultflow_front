export type CurrencyCode = 'NGN' | 'USD' | 'CFA' | 'KES' | 'ZAR' | 'GHS' | 'MAD';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  id: string;
  companyId: string;
  accountCode: string; // e.g., "1000"
  accountName: string; // e.g., "Cash"
  accountType: AccountType;
  parentAccountId?: string | null;
  currency: CurrencyCode; // company base currency
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrialBalanceEntry {
  accountCode: string;
  debit: number; // positive number in base currency
  credit: number; // positive number in base currency
  name?: string; // optional account name from upload for fuzzy mapping
}

export interface TrialBalance {
  id: string;
  companyId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  entries: TrialBalanceEntry[];
  uploadedBy: string; // consultantId
  uploadedAt: string; // ISO timestamp
  status: 'draft' | 'pending_approval' | 'approved' | 'locked';
  notes?: string;
}

export type TaxTemplateType = 'VAT' | 'PAYE' | 'WHT' | 'CIT';

export interface TaxTemplate {
  id: string;
  companyId: string;
  name: string; // e.g., "Nigeria VAT 7.5%"
  type: TaxTemplateType;
  rate: number; // percentage e.g., 7.5
  rules?: Record<string, any>; // JSON for exemptions, thresholds
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CoATreeNode = ChartOfAccount & { children?: CoATreeNode[] };
