import { frappeAPI } from '@shared/api/client';
import axios from 'axios';

export interface DrillDownData {
    account_code: string;
    account_name: string;
    balance: number;
    transactions: TransactionDetail[];
    children?: DrillDownData[];
}

export interface TransactionDetail {
    id: string;
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    created_by: string;
}

export interface CompanyData {
    id: string;
    name: string;
    currency: string;
    fiscal_year_start: string;
    fiscal_year_end: string;
    is_active: boolean;
}

export interface ConsolidatedData {
    companies: CompanyData[];
    consolidated_accounts: DrillDownData[];
    elimination_entries: {
        description: string;
        debit_account: string;
        credit_account: string;
        amount: number;
    }[];
    total_revenue: number;
    total_expenses: number;
    net_income: number;
}

class LiveDataService {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    private getDataSource(): 'demo' | 'localDb' | 'frappe' {
        return (process.env.NEXT_PUBLIC_DATA_SOURCE as 'demo' | 'localDb' | 'frappe') || 'localDb';
    }

    private getLocalApiUrl(): string {
        return process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || '/api/local';
    }

    async getCompanies(): Promise<CompanyData[]> {
        const cached = this.getFromCache('companies');
        if (cached) return cached;

        const dataSource = this.getDataSource();
        
        try {
            let response;
            
            if (dataSource === 'localDb') {
                // Try local API first
                const localApiUrl = this.getLocalApiUrl();
                const apiResponse = await axios.get(`${localApiUrl}/companies`);
                response = apiResponse.data.items || apiResponse.data; // Handle both {items: [...]} and [...] formats
            } else if (dataSource === 'frappe') {
                // Use Frappe API
                response = await frappeAPI.getCompanies();
            } else {
                // Demo mode - return mock data immediately
                throw new Error('Demo mode - use mock data');
            }
            
            this.setCache('companies', response);
            return response;
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            // Return mock companies for development when backend is not available
            const mockCompanies = [
                {
                    id: 'lagos-ng',
                    name: 'TechFlow Nigeria Ltd',
                    currency: 'NGN',
                    fiscal_year_start: '2024-01-01',
                    fiscal_year_end: '2024-12-31',
                    is_active: true
                },
                {
                    id: 'nairobi-ke',
                    name: 'East Africa Logistics Co',
                    currency: 'KES',
                    fiscal_year_start: '2024-01-01',
                    fiscal_year_end: '2024-12-31',
                    is_active: true
                },
                {
                    id: 'cape-town-za',
                    name: 'Southern Mining Corp',
                    currency: 'ZAR',
                    fiscal_year_start: '2024-01-01',
                    fiscal_year_end: '2024-12-31',
                    is_active: true
                }
            ];
            this.setCache('companies', mockCompanies);
            return mockCompanies;
        }
    }

    async getDrillDownData(
        companyId: string, 
        accountCode: string,
        dateFrom: string,
        dateTo: string
    ): Promise<DrillDownData> {
        const cacheKey = `drilldown-${companyId}-${accountCode}-${dateFrom}-${dateTo}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Get account details
            const account = await frappeAPI.getDoc('Account', accountCode);
            
            // Get transactions for this account
            const glEntries = await frappeAPI.getGeneralLedger({
                company: companyId,
                from_date: dateFrom,
                to_date: dateTo,
                account: accountCode
            });

            const transactions: TransactionDetail[] = glEntries.map((entry: any) => ({
                id: entry.name || `${entry.voucher_type}-${entry.voucher_no}`,
                date: entry.posting_date,
                reference: `${entry.voucher_type} ${entry.voucher_no}`,
                description: entry.remarks || entry.account,
                debit: entry.debit || 0,
                credit: entry.credit || 0,
                balance: entry.balance || 0,
                created_by: entry.owner || 'System'
            }));

            // Calculate balance
            const balance = transactions.reduce((sum, txn) => sum + txn.debit - txn.credit, 0);

            // Get child accounts if this is a group account
            let children: DrillDownData[] = [];
            if (account.is_group) {
                const childAccounts = await frappeAPI.getList('Account', 
                    { parent_account: accountCode, company: companyId },
                    ['name', 'account_name', 'account_type']
                );

                children = await Promise.all(
                    childAccounts.data.map(child => 
                        this.getDrillDownData(companyId, child.name, dateFrom, dateTo)
                    )
                );
            }

            const result: DrillDownData = {
                account_code: accountCode,
                account_name: account.account_name || accountCode,
                balance,
                transactions,
                children: children.length > 0 ? children : undefined
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error(`Failed to get drill-down data for ${accountCode}:`, error);
            
            // Return mock data as fallback
            return this.getMockDrillDownData(companyId, accountCode, dateFrom, dateTo);
        }
    }

    async getConsolidatedData(
        companyIds: string[],
        from_date: string,
        to_date: string
    ): Promise<ConsolidatedData> {
        const cacheKey = `consolidated-${companyIds.join(',')}-${from_date}-${to_date}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const dataSource = this.getDataSource();
        
        try {
            const companies = await this.getCompanies();
            const selectedCompanies = companies.filter(c => companyIds.includes(c.id));

            // Fetch reports for each company
            let reports;
            
            if (dataSource === 'localDb') {
                // Try local API first
                const localApiUrl = this.getLocalApiUrl();
                const reportPromises = selectedCompanies.map(async (company) => {
                    try {
                        const [plReport, bsReport] = await Promise.all([
                            axios.get(`${localApiUrl}/reports/profit-loss`, {
                                params: { company: company.id, from_date, to_date }
                            }).then(res => res.data),
                            axios.get(`${localApiUrl}/reports/balance-sheet`, {
                                params: { company: company.id, as_on_date: to_date }
                            }).then(res => res.data)
                        ]);
                        return { company, plReport, bsReport };
                    } catch (error) {
                        console.warn(`Failed to fetch reports for ${company.name}:`, error);
                        return null;
                    }
                });
                reports = await Promise.all(reportPromises);
            } else if (dataSource === 'frappe') {
                // Use Frappe API
                reports = await Promise.all(
                    selectedCompanies.map(async (company) => {
                        try {
                            const [plReport, bsReport] = await Promise.all([
                                frappeAPI.generateProfitLoss({
                                    company: company.name,
                                    from_date,
                                    to_date,
                                    periodicity: 'Monthly'
                                }),
                                frappeAPI.generateBalanceSheet({
                                    company: company.name,
                                    as_on_date: to_date,
                                    periodicity: 'Monthly'
                                })
                            ]);
                            return { company, plReport, bsReport };
                        } catch (error) {
                            console.warn(`Failed to fetch reports for ${company.name}:`, error);
                            return null;
                        }
                    })
                );
            } else {
                // Demo mode - throw error to trigger mock data
                throw new Error('Demo mode - use mock data');
            }

            // Filter out failed requests
            const validReports = reports.filter(Boolean);

            const result: ConsolidatedData = {
                companies: selectedCompanies,
                consolidated_accounts: this.consolidateAccounts(validReports),
                elimination_entries: this.generateEliminationEntries(selectedCompanies),
                total_revenue: 0,
                total_expenses: 0,
                net_income: 0
            };

            // Calculate totals
            result.consolidated_accounts.forEach(account => {
                if (account.account_name.toLowerCase().includes('revenue')) {
                    result.total_revenue += account.balance;
                } else if (account.account_name.toLowerCase().includes('expense')) {
                    result.total_expenses += Math.abs(account.balance);
                }
            });
            result.net_income = result.total_revenue - result.total_expenses;

            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Failed to get consolidated data:', error);
            // Return mock consolidated data for development
            const mockResult: ConsolidatedData = {
                companies: companyIds.map(id => ({
                    id,
                    name: `${id.charAt(0).toUpperCase() + id.slice(1)} Office`,
                    currency: 'NGN',
                    fiscal_year_start: '2024-01-01',
                    fiscal_year_end: '2024-12-31',
                    is_active: true
                })),
                consolidated_accounts: [
                    {
                        account_code: '4000',
                        account_name: 'Revenue',
                        balance: 2450000,
                        transactions: []
                    },
                    {
                        account_code: '5000',
                        account_name: 'Cost of Goods Sold',
                        balance: -1470000,
                        transactions: []
                    },
                    {
                        account_code: '6000',
                        account_name: 'Operating Expenses',
                        balance: -595000,
                        transactions: []
                    }
                ],
                elimination_entries: [
                    {
                        description: 'Inter-company sales elimination',
                        debit_account: 'Revenue',
                        credit_account: 'Cost of Goods Sold',
                        amount: 75000
                    }
                ],
                total_revenue: 2450000,
                total_expenses: 2065000,
                net_income: 385000
            };
            this.setCache(cacheKey, mockResult);
            return mockResult;
        }
    }

    private consolidateAccounts(companyReports: any[]): DrillDownData[] {
        const accountMap = new Map<string, DrillDownData>();

        companyReports.forEach(({ companyId, pl, bs }) => {
            // Process P&L accounts
            this.processReportAccounts(pl, accountMap, companyId);
            // Process BS accounts  
            this.processReportAccounts(bs, accountMap, companyId);
        });

        return Array.from(accountMap.values());
    }

    private processReportAccounts(report: any, accountMap: Map<string, DrillDownData>, companyId: string) {
        if (!report || !report.result) return;

        report.result.forEach((section: any) => {
            if (section.account_name && section.balance !== undefined) {
                const existing = accountMap.get(section.account_name);
                if (existing) {
                    existing.balance += section.balance || 0;
                } else {
                    accountMap.set(section.account_name, {
                        account_code: section.account || section.account_name,
                        account_name: section.account_name,
                        balance: section.balance || 0,
                        transactions: [] // Populate with actual transactions if needed
                    });
                }
            }
        });
    }

    private generateEliminationEntries(companyReports: any[]) {
        // Mock elimination entries - in real scenario, this would be configured
        return [
            {
                description: 'Eliminate intercompany receivables/payables',
                debit_account: 'Intercompany Payables',
                credit_account: 'Intercompany Receivables',
                amount: 150000
            },
            {
                description: 'Eliminate intercompany sales/purchases',
                debit_account: 'Intercompany Sales',
                credit_account: 'Intercompany Purchases',
                amount: 500000
            }
        ];
    }

    private calculateConsolidatedTotals(accounts: DrillDownData[], eliminations: any[]) {
        const revenue = accounts
            .filter(acc => acc.account_name.toLowerCase().includes('revenue') || acc.account_name.toLowerCase().includes('sales'))
            .reduce((sum, acc) => sum + acc.balance, 0);

        const expenses = accounts
            .filter(acc => acc.account_name.toLowerCase().includes('expense') || acc.account_name.toLowerCase().includes('cost'))
            .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

        const eliminationAdjustments = eliminations.reduce((sum, elim) => sum + elim.amount, 0);

        return {
            revenue: revenue - eliminationAdjustments,
            expenses,
            netIncome: revenue - expenses - eliminationAdjustments
        };
    }

    private getMockDrillDownData(companyId: string, accountCode: string, dateFrom: string, dateTo: string): DrillDownData {
        // Generate realistic mock data based on company and account
        const transactions: TransactionDetail[] = Array.from({ length: 10 }, (_, i) => ({
            id: `txn-${i + 1}`,
            date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            reference: `INV-${1000 + i}`,
            description: `Transaction ${i + 1} for ${accountCode}`,
            debit: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0,
            credit: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0,
            balance: Math.floor(Math.random() * 100000),
            created_by: 'admin@consultflow.com'
        }));

        return {
            account_code: accountCode,
            account_name: accountCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            balance: transactions.reduce((sum, txn) => sum + txn.debit - txn.credit, 0),
            transactions
        };
    }

    private getMockConsolidatedData(companyIds: string[], dateFrom: string, dateTo: string): ConsolidatedData {
        return {
            companies: [
                { id: 'lagos-ng', name: 'TechFlow Nigeria Ltd', currency: 'NGN', fiscal_year_start: '01-01', fiscal_year_end: '12-31', is_active: true },
                { id: 'nairobi-ke', name: 'East Africa Logistics Co', currency: 'KES', fiscal_year_start: '01-01', fiscal_year_end: '12-31', is_active: true }
            ],
            consolidated_accounts: [
                { account_code: '4000', account_name: 'Revenue', balance: 2500000, transactions: [] },
                { account_code: '5000', account_name: 'Cost of Goods Sold', balance: -1500000, transactions: [] },
                { account_code: '6000', account_name: 'Operating Expenses', balance: -600000, transactions: [] }
            ],
            elimination_entries: [
                { description: 'Eliminate intercompany sales', debit_account: 'Intercompany Sales', credit_account: 'Revenue', amount: 200000 }
            ],
            total_revenue: 2300000,
            total_expenses: 2100000,
            net_income: 200000
        };
    }

    private getFromCache(key: string) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    private setCache(key: string, data: any) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clearCache() {
        this.cache.clear();
    }
}

export const liveDataService = new LiveDataService();
export default LiveDataService;