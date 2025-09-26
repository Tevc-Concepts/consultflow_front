export interface FinancialReport {
    id: string;
    company_id: string;
    company_ids?: string[]; // For consolidated reports
    type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance';
    name: string;
    period_start: string;
    period_end: string;
    currency: 'NGN' | 'USD' | 'CFA';
    is_consolidated: boolean;
    data: ReportData;
    metadata: ReportMetadata;
    created_at: string;
    updated_at: string;
    created_by: string;
}

export interface ReportData {
    sections: ReportSection[];
    totals: ReportTotals;
    exchange_rates?: ExchangeRateSnapshot[];
}

export interface ReportSection {
    id: string;
    name: string;
    type: string;
    line_items: ReportLineItem[];
    subtotal: number;
    order: number;
}

export interface ReportLineItem {
    id: string;
    account_id: string;
    account_code: string;
    account_name: string;
    current_period: number;
    prior_period?: number;
    variance?: number;
    variance_percent?: number;
    drill_down?: TransactionSummary[];
    order: number;
}

export interface ReportTotals {
    gross_revenue?: number;
    gross_profit?: number;
    operating_income?: number;
    net_income?: number;
    total_assets?: number;
    total_liabilities?: number;
    total_equity?: number;
    cash_from_operations?: number;
    cash_from_investing?: number;
    cash_from_financing?: number;
    net_cash_flow?: number;
}

export interface ReportMetadata {
    generated_at: string;
    generated_by: string;
    filters_applied: ReportFilters;
    consolidation_method?: string;
    audit_trail: AuditEntry[];
}

export interface ReportFilters {
    date_range: {
        start: string;
        end: string;
    };
    accounts?: string[];
    departments?: string[];
    projects?: string[];
    exclude_zero_balances: boolean;
}

export interface TransactionSummary {
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

export interface AuditEntry {
    timestamp: string;
    user_id: string;
    user_name: string;
    action: string;
    details: Record<string, any>;
}

export interface ExchangeRateSnapshot {
    date: string;
    from_currency: 'NGN' | 'USD' | 'CFA';
    to_currency: 'NGN' | 'USD' | 'CFA';
    rate: number;
}

export interface ReportAdjustment {
    id: string;
    report_id: string;
    account_id: string;
    account_code: string;
    account_name: string;
    adjustment_amount: number;
    reason: string;
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    created_by: string;
}