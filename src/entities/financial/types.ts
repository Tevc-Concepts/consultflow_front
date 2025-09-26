export interface FinancialAccount {
    id: string;
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    subtype: string;
    parent_id?: string;
    company_id: string;
    currency: 'NGN' | 'USD' | 'CFA';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    date: string;
    reference: string;
    description: string;
    company_id: string;
    currency: 'NGN' | 'USD' | 'CFA';
    exchange_rate: number;
    entries: TransactionEntry[];
    attachments: string[];
    tags: string[];
    created_at: string;
    updated_at: string;
    created_by: string;
}

export interface TransactionEntry {
    id: string;
    account_id: string;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    currency: 'NGN' | 'USD' | 'CFA';
    exchange_rate: number;
    description?: string;
}

export interface FinancialPeriod {
    id: string;
    company_id: string;
    name: string;
    start_date: string;
    end_date: string;
    type: 'month' | 'quarter' | 'year';
    is_closed: boolean;
    created_at: string;
    updated_at: string;
}

export interface ExchangeRate {
    id: string;
    from_currency: 'NGN' | 'USD' | 'CFA';
    to_currency: 'NGN' | 'USD' | 'CFA';
    rate: number;
    date: string;
    source: 'manual' | 'cbn' | 'xe' | 'yahoo';
    created_at: string;
}

export interface Budget {
    id: string;
    company_id: string;
    name: string;
    period_start: string;
    period_end: string;
    currency: 'NGN' | 'USD' | 'CFA';
    line_items: BudgetLineItem[];
    status: 'draft' | 'approved' | 'active' | 'closed';
    created_at: string;
    updated_at: string;
    created_by: string;
}

export interface BudgetLineItem {
    id: string;
    account_id: string;
    account_code: string;
    account_name: string;
    budgeted_amount: number;
    actual_amount: number;
    variance: number;
    variance_percent: number;
}