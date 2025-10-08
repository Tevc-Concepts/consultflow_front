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
  currency?: CurrencyCode; // currency of original values (if multi-currency upload). If omitted, assume company base currency
  originalDebit?: number; // if currency provided, store original amount before conversion
  originalCredit?: number; // if currency provided, store original amount before conversion
  fxRateToBase?: number; // rate used to convert original currency to base
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
  currency?: CurrencyCode; // base currency used for debit/credit
  adjustments?: TrialBalanceAdjustment[]; // post-upload adjustments
}

// Manual or system adjustment to a trial balance after initial upload
export interface TrialBalanceAdjustment {
  id: string;
  tbId: string;
  accountCode: string;
  debit: number; // positive numbers only - use credit for negative adjustments instead of sign flips
  credit: number;
  reason?: string;
  createdAt: string;
  createdBy: string; // user/consultant id
  currency?: CurrencyCode;
  originalDebit?: number;
  originalCredit?: number;
  fxRateToBase?: number;
}

// Generic journal/transaction entry (future drill-down + bank reconciliation)
export interface JournalTransaction {
  id: string;
  companyId: string;
  date: string; // ISO date
  accountCode: string;
  description?: string;
  debit: number;
  credit: number;
  currency: CurrencyCode; // currency of debit/credit (converted to base when aggregating reports)
  source: 'upload' | 'manual' | 'adjustment' | 'integration';
  reference?: string; // invoice no, bank ref, etc.
  createdAt: string;
  createdBy: string;
  originalDebit?: number;
  originalCredit?: number;
  fxRateToBase?: number;
}

// Exchange rate record (simplified)
export interface ExchangeRate {
  id: string; // base-target-date composite
  base: CurrencyCode; // company base
  target: CurrencyCode; // original currency
  date: string; // YYYY-MM-DD
  rate: number; // multiply original * rate = base
  source?: string;
  createdAt: string;
}

// Audit trail
export interface AuditEvent {
  id: string;
  entity: 'trial_balance' | 'adjustment' | 'transaction';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  timestamp: string;
  userId: string;
  changes?: Record<string, { from: any; to: any }>;
  meta?: Record<string, any>;
}

// Permission flags for UI gating (could later be dynamic)
export interface AccountingPermissions {
  canAddAdjustment: boolean;
  canApproveTB: boolean;
  canLockTB: boolean;
  canUploadTransactions: boolean;
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
