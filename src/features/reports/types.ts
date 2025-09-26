export type Transaction = {
    id: string;
    date: string; // ISO
    account: 'Sales' | 'COGS' | 'Payroll' | 'Rent' | 'Marketing' | 'Other';
    description: string;
    amount: number; // NGN
    type: 'Revenue' | 'COGS' | 'Expense';
};

export type PLRow = {
    key: string;
    label: string;
    amount: number;
    type: 'Revenue' | 'COGS' | 'Expense' | 'Computed';
    account?: Transaction['account'];
    expandable?: boolean;
};

export interface ReportsResponse {
    series: Array<{ 
        date: string; 
        revenue: number; 
        expenses: number; 
        cogs?: number;
    }>;
}

export interface ReportFilters {
    query: string;
    minAmount: string;
    maxAmount: string;
    account: Transaction['account'] | 'All';
    type: Transaction['type'] | 'All';
    expanded: Record<string, boolean>;
}