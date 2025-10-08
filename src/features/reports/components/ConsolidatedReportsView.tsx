'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import getApi from '@shared/api/client';
import { accountingRepository } from '@shared/repositories/accountingRepository';
import { useAppStore } from '@shared/state/app';
import RechartsBarChart from '@shared/components/BarChart';
import { useFxRates } from '@shared/hooks/useFx';
import FxBadge from '@shared/components/FxBadge';

// Types for the consolidated data
interface CompanyData {
    id: string;
    name: string;
    currency: string;
    fiscal_year_start?: string;
    fiscal_year_end?: string;
    is_active?: boolean;
}

interface KPI {
    key: string;
    label: string;
    value: number;
    delta: number;
}

interface BalanceSheetLine {
    key: string;
    label: string;
    amount: number;
}

interface ConsolidatedApiData {
    companies: CompanyData[];
    kpis: KPI[];
    balanceSheet: {
        asOf: string;
        lines: BalanceSheetLine[];
    };
}

interface ConsolidatedDisplayData {
    companies: CompanyData[];
    total_revenue: number;
    total_expenses: number;
    net_income: number;
    consolidated_accounts: {
        account_code: string;
        account_name: string;
        balance: number;
    }[];
    elimination_entries: {
        description: string;
        debit_account: string;
        credit_account: string;
        amount: number;
    }[];
}

export default function ConsolidatedReportsView() {
    const { selectedCompanyIds, reportingCurrency, consolidated, dataSource, demoMode } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [consolidatedData, setConsolidatedData] = useState<ConsolidatedDisplayData | null>(null);
    const [showEliminationDetails, setShowEliminationDetails] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [drillDownKPI, setDrillDownKPI] = useState<string | null>(null);
    const [companyBreakdowns, setCompanyBreakdowns] = useState<{[key: string]: any}>({});
    // Drill-down state for account transactions
    const [drillAccount, setDrillAccount] = useState<{ code: string; name: string } | null>(null);
    const [drillTxns, setDrillTxns] = useState<any[]>([]);
    const [drillLoading, setDrillLoading] = useState(false);
    const [drillStart, setDrillStart] = useState<string>('');
    const [drillEnd, setDrillEnd] = useState<string>('');
    const [drillSource, setDrillSource] = useState<string>('all');
    const { convert: fxConvert } = useFxRates();

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadCompanyBreakdowns = useCallback(async (companies: CompanyData[]) => {
        try {
            const api = getApi();
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const endpoint = dataSource === 'demo' ? '/api/demo/reports' : 
                           dataSource === 'localDb' ? '/api/local/reports' : 
                           '/api/reports';
            
            const breakdowns: {[key: string]: any} = {};
            
            for (const company of companies) {
                const response = await api.get(endpoint, {
                    params: { 
                        company: company.id,
                        currency: reportingCurrency
                    }
                });
                breakdowns[company.id] = response.data;
            }
            
            setCompanyBreakdowns(breakdowns);
        } catch (error) {
            console.error('Failed to load company breakdowns:', error);
        }
    }, [reportingCurrency]);

    const loadConsolidatedData = useCallback(async () => {
        setLoading(true);
        try {
            const api = getApi();
            const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
            const endpoint = dataSource === 'demo' ? '/api/demo/reports' : 
                           dataSource === 'localDb' ? '/api/local/reports' : 
                           '/api/reports';
            
            const response = await api.get<ConsolidatedApiData>(endpoint, {
                params: { 
                    consolidated: 'true',
                    currency: reportingCurrency
                }
            });

            const apiData = response.data;
            
            // Transform API data to display format
            const revenueKpi = apiData.kpis.find(k => k.key === 'revenue');
            const netIncomeKpi = apiData.kpis.find(k => k.key === 'netIncome');
            const grossProfitKpi = apiData.kpis.find(k => k.key === 'grossProfit');
            
            // Calculate total expenses from revenue and net income
            const totalRevenue = revenueKpi?.value || 0;
            const totalNetIncome = netIncomeKpi?.value || 0;
            const totalGrossProfit = grossProfitKpi?.value || 0;
            const totalExpenses = totalGrossProfit - totalNetIncome; // Gross profit - Net income = Operating expenses
            
            // Transform balance sheet lines to consolidated accounts
            const consolidated_accounts = apiData.balanceSheet.lines.map(line => ({
                account_code: line.key.toUpperCase(),
                account_name: line.label,
                balance: line.amount
            }));

            // Mock elimination entries for demonstration
            const elimination_entries = [
                {
                    description: 'Inter-company receivables/payables elimination',
                    debit_account: 'Accounts Payable',
                    credit_account: 'Accounts Receivable', 
                    amount: Math.abs(totalRevenue * 0.02) // 2% of revenue as inter-company
                },
                {
                    description: 'Inter-company sales elimination',
                    debit_account: 'Revenue',
                    credit_account: 'Cost of Goods Sold',
                    amount: Math.abs(totalRevenue * 0.01) // 1% of revenue
                }
            ];

            const transformedData: ConsolidatedDisplayData = {
                companies: apiData.companies,
                total_revenue: totalRevenue,
                total_expenses: Math.max(totalExpenses, 0),
                net_income: totalNetIncome,
                consolidated_accounts,
                elimination_entries
            };

            setConsolidatedData(transformedData);
            
            // Load individual company data for drill-down
            await loadCompanyBreakdowns(apiData.companies);
        } catch (error) {
            console.error('Failed to load consolidated data:', error);
            // Fallback: consolidate from TB + CoA with FX conversion and simple eliminations
            try {
                accountingRepository.seedDemo();
                const apiLocal = getApi();
                // Try to get latest exchange rates (local demo API)
                // rates are managed by hook; if unavailable, fxConvert is a no-op

                const companies = (useAppStore.getState().selectedCompanyIds || []).length > 0 ? useAppStore.getState().selectedCompanyIds : ['lagos-ng'];

                // Basic FX converter bridging via NGN; expects NGN_* rates as NGN per 1 unit of foreign
                const fxC = (amount: number, from: string, to: string): number => fxConvert(amount, from, to);

                let revenue = 0, expenses = 0, netIncome = 0;
                const accountTotals = new Map<string, { name: string; balance: number }>();
                const companyInfos: CompanyData[] = [];

                companies.forEach(cid => {
                    const tbs = accountingRepository.listTB(cid).sort((a,b)=>a.periodEnd.localeCompare(b.periodEnd));
                    const tb = tbs[tbs.length - 1];
                    const coa = accountingRepository.listCoA(cid);
                    if (!tb || coa.length === 0) return;
                    const byCode = new Map(coa.map(a => [a.accountCode, a] as const));
                    const companyCurrency = (coa[0]?.currency || 'NGN') as string;
                    companyInfos.push({ id: cid, name: cid, currency: companyCurrency });
                    tb.entries.forEach(e => {
                        const acc = byCode.get(e.accountCode);
                        if (!acc) return;
                        const balCompany = e.debit - e.credit; // company currency, debit positive
                        const bal = fxC(balCompany, companyCurrency, reportingCurrency);
                        if (acc.accountType === 'Revenue') revenue += -bal; // credit balance -> positive revenue
                        if (acc.accountType === 'Expense') expenses += bal;
                        // aggregate per account code for display
                        const prev = accountTotals.get(e.accountCode) || { name: acc.accountName, balance: 0 };
                        prev.balance += bal;
                        accountTotals.set(e.accountCode, prev);
                    });
                });
                netIncome = revenue - expenses;
                const elimination_entries = [
                    { description: 'Intercompany sales elimination (1%)', debit_account: 'Revenue', credit_account: 'COGS', amount: revenue * 0.01 }
                ];
                // Build top-N accounts by absolute balance
                const accounts = Array.from(accountTotals.entries())
                  .map(([code, v]) => ({ account_code: code, account_name: v.name, balance: v.balance }))
                  .sort((a,b) => Math.abs(b.balance) - Math.abs(a.balance))
                  .slice(0, 12);
                setConsolidatedData({
                    companies: companyInfos.length ? companyInfos : companies.map(id => ({ id, name: id, currency: reportingCurrency } as any)),
                    total_revenue: revenue,
                    total_expenses: expenses,
                    net_income: netIncome - elimination_entries.reduce((s,e)=>s+e.amount,0),
                    consolidated_accounts: accounts,
                    elimination_entries
                });
            } catch (e2) {
                // swallowed; UI will show error state
            }
        } finally {
            setLoading(false);
        }
    }, [loadCompanyBreakdowns, reportingCurrency, fxConvert]);

    useEffect(() => {
        if (mounted && consolidated) {
            loadConsolidatedData();
        }
    }, [mounted, consolidated, loadConsolidatedData]);

    const handleKPIDrillDown = (kpiKey: string) => {
        setDrillDownKPI(drillDownKPI === kpiKey ? null : kpiKey);
    };

    const renderKPIBreakdown = (kpiKey: string) => {
        if (!consolidatedData || drillDownKPI !== kpiKey) return null;

        return (
            <div className="mt-4 bg-white/50 rounded-xl p-4 border border-medium/40">
                <h4 className="font-medium mb-3 text-deep-navy">
                    {kpiKey === 'revenue' ? 'Revenue' : kpiKey === 'expenses' ? 'Expenses' : 'Net Income'} Breakdown by Company
                </h4>
                <div className="space-y-2">
                    {consolidatedData.companies.map((company) => {
                        const companyData = companyBreakdowns[company.id];
                        if (!companyData) return null;

                        let value = 0;
                        if (kpiKey === 'revenue') {
                            value = companyData.kpis?.find((k: any) => k.key === 'revenue')?.value || 0;
                        } else if (kpiKey === 'expenses') {
                            const revenue = companyData.kpis?.find((k: any) => k.key === 'revenue')?.value || 0;
                            const netIncome = companyData.kpis?.find((k: any) => k.key === 'netIncome')?.value || 0;
                            const grossProfit = companyData.kpis?.find((k: any) => k.key === 'grossProfit')?.value || 0;
                            value = grossProfit - netIncome;
                        } else if (kpiKey === 'netIncome') {
                            value = companyData.kpis?.find((k: any) => k.key === 'netIncome')?.value || 0;
                        }

                        const percentage = consolidatedData.total_revenue > 0 
                            ? (value / (kpiKey === 'revenue' ? consolidatedData.total_revenue : 
                                       kpiKey === 'expenses' ? consolidatedData.total_expenses : 
                                       consolidatedData.net_income)) * 100 
                            : 0;

                        return (
                            <div key={company.id} className="flex items-center justify-between py-2 border-b border-medium/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cobalt to-violet"></div>
                                    <div>
                                        <div className="font-medium text-sm">{company.name}</div>
                                        <div className="text-xs text-deep-navy/60">{company.currency}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-sm">
                                        {formatCurrency(value)}
                                    </div>
                                    <div className="text-xs text-deep-navy/60">
                                        {percentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: reportingCurrency
        }).format(amount);
    };

    const openAccountDrillDown = useCallback((account_code: string, account_name: string) => {
        if (!selectedCompanyIds.length) return;
        setDrillLoading(true);
        setDrillAccount({ code: account_code, name: account_name });
        try {
            // Aggregate transactions across selected companies for the chosen account
            const all: any[] = [];
            selectedCompanyIds.forEach(cid => {
                const list = accountingRepository.listTransactions(cid) || [];
                list.forEach(tx => {
                    if (tx.accountCode === account_code) {
                        all.push({ ...tx, companyId: cid });
                    }
                });
            });
            // Sort latest first
            all.sort((a,b) => b.date.localeCompare(a.date));
            setDrillTxns(all);
        } finally {
            setDrillLoading(false);
        }
    }, [selectedCompanyIds]);

    const closeDrill = () => {
        setDrillAccount(null);
        setDrillTxns([]);
        setDrillStart('');
        setDrillEnd('');
        setDrillSource('all');
    };

    // Prevent hydration mismatch by not rendering dynamic content until mounted
    if (!mounted) {
        return (
            <Card>
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-lg font-semibold mb-2">Loading...</h3>
                    <div className="animate-pulse bg-medium/40 h-4 w-32 mx-auto rounded"></div>
                </div>
            </Card>
        );
    }

    if (!consolidated) {
        return (
            <Card>
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏢</div>
                    <h3 className="text-lg font-semibold mb-2">Multi-Entity Consolidation</h3>
                    <p className="text-deep-navy/70 mb-4">
                        Enable consolidation in Settings to view combined financial data across multiple companies.
                    </p>
                    <Button onClick={() => window.location.href = '/settings'}>
                        Go to Settings
                    </Button>
                </div>
            </Card>
        );
    }

    if (selectedCompanyIds.length < 1) {
        return (
            <Card>
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏢</div>
                    <h3 className="text-lg font-semibold mb-2">Select Companies</h3>
                    <p className="text-deep-navy/70 mb-4">
                        Select companies to generate consolidated reports.
                    </p>
                    <Button onClick={() => window.location.href = '/settings'}>
                        Go to Settings
                    </Button>
                </div>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-medium/40 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    if (!consolidatedData) {
        return (
            <Card>
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold mb-2">Consolidation Failed</h3>
                    <p className="text-deep-navy/70 mb-4">
                        Unable to load consolidated data. Please try again.
                    </p>
                    <Button onClick={loadConsolidatedData}>
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-r from-cobalt to-violet text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">
                            🏢 Consolidated Financial Report
                        </h2>
                        <p className="text-white/90">
                            Combined results for {consolidatedData.companies.length} entities
                        </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        <FxBadge className="bg-white/20 border-white/40 text-white/90" showRefresh />
                        <div className="text-sm text-white/80">Net Income</div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(consolidatedData.net_income)}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Company Summary */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">Consolidated Entities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {consolidatedData.companies.map((company) => (
                        <div key={company.id} className="p-4 border border-medium/40 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{company.name}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    company.is_active 
                                        ? 'bg-emerald/10 text-emerald border border-emerald/20'
                                        : 'bg-coral/10 text-coral border border-coral/20'
                                }`}>
                                    {company.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="text-sm text-deep-navy/70">
                                <div>Currency: {company.currency}</div>
                                <div>FY: {company.fiscal_year_start} to {company.fiscal_year_end}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                    className="bg-emerald/10 border border-emerald/20 cursor-pointer hover:bg-emerald/15 transition-colors"
                    onClick={() => handleKPIDrillDown('revenue')}
                >
                    <div className="text-center">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-emerald text-2xl">📈</div>
                            <div className="text-xs text-emerald/70">Click for breakdown</div>
                        </div>
                        <div className="text-sm font-medium text-emerald mb-1">Total Revenue</div>
                        <div className="text-xl font-bold text-emerald">
                            {formatCurrency(consolidatedData.total_revenue)}
                        </div>
                    </div>
                    {renderKPIBreakdown('revenue')}
                </Card>

                <Card 
                    className="bg-amber/10 border border-amber/20 cursor-pointer hover:bg-amber/15 transition-colors"
                    onClick={() => handleKPIDrillDown('expenses')}
                >
                    <div className="text-center">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-amber text-2xl">💰</div>
                            <div className="text-xs text-amber/70">Click for breakdown</div>
                        </div>
                        <div className="text-sm font-medium text-amber mb-1">Total Expenses</div>
                        <div className="text-xl font-bold text-amber">
                            {formatCurrency(consolidatedData.total_expenses)}
                        </div>
                    </div>
                    {renderKPIBreakdown('expenses')}
                </Card>

                <Card 
                    className="bg-cobalt/10 border border-cobalt/20 cursor-pointer hover:bg-cobalt/15 transition-colors"
                    onClick={() => handleKPIDrillDown('netIncome')}
                >
                    <div className="text-center">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-cobalt text-2xl">🎯</div>
                            <div className="text-xs text-cobalt/70">Click for breakdown</div>
                        </div>
                        <div className="text-sm font-medium text-cobalt mb-1">Net Income</div>
                        <div className="text-xl font-bold text-cobalt">
                            {formatCurrency(consolidatedData.net_income)}
                        </div>
                    </div>
                    {renderKPIBreakdown('netIncome')}
                </Card>
            </div>

            {/* Consolidation Chart */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Consolidated Account Balances</h3>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowEliminationDetails(!showEliminationDetails)}
                    >
                        {showEliminationDetails ? 'Hide' : 'Show'} Eliminations
                    </Button>
                </div>

                <div className="h-80 mb-4">
                    <RechartsBarChart 
                        data={consolidatedData.consolidated_accounts.map(account => ({
                            name: account.account_name,
                            balance: Math.abs(account.balance) / 1000
                        }))}
                        bars={[
                            { dataKey: 'balance', fill: '#2774FF', name: 'Balance' }
                        ]}
                        height="100%"
                        loading={loading}
                    />
                </div>

                {/* Account Details */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-medium/60">
                                <th className="text-left py-3 font-semibold">Account</th>
                                <th className="text-right py-3 font-semibold">Consolidated Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consolidatedData.consolidated_accounts.map((account) => (
                                <tr
                                    key={account.account_code}
                                    className="border-b border-medium/40 hover:bg-cobalt/10 cursor-pointer"
                                    onClick={() => openAccountDrillDown(account.account_code, account.account_name)}
                                >
                                    <td className="py-2">
                                        <div className="font-medium">{account.account_name}</div>
                                        <div className="text-xs text-deep-navy/60">{account.account_code}</div>
                                    </td>
                                    <td className="py-2 text-right font-medium">
                                        <span className={account.balance >= 0 ? 'text-emerald' : 'text-coral'}>
                                            {formatCurrency(account.balance)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Elimination Entries */}
            {showEliminationDetails && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">🔄 Elimination Entries</h3>
                    <p className="text-sm text-deep-navy/70 mb-4">
                        These entries eliminate intercompany transactions to prevent double-counting in the consolidated results.
                    </p>
                    
                    <div className="space-y-3">
                        {consolidatedData.elimination_entries.map((entry, index) => (
                            <div key={index} className="p-4 border border-medium/40 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{entry.description}</h4>
                                    <span className="font-bold text-coral">
                                        {formatCurrency(entry.amount)}
                                    </span>
                                </div>
                                <div className="text-sm text-deep-navy/70">
                                    <div>Debit: {entry.debit_account}</div>
                                    <div>Credit: {entry.credit_account}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-amber/10 border border-amber/20 rounded-xl">
                        <div className="text-sm font-medium text-amber">Total Eliminations Impact</div>
                        <div className="text-lg font-bold text-amber">
                            {formatCurrency(consolidatedData.elimination_entries.reduce((sum, entry) => sum + entry.amount, 0))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button onClick={loadConsolidatedData} variant="ghost">
                    🔄 Refresh Data
                </Button>
                <Button 
                    onClick={() => {
                        // Export consolidated data
                        const csvData = consolidatedData.consolidated_accounts.map(account => ({
                            'Account Code': account.account_code,
                            'Account Name': account.account_name,
                            'Balance': account.balance
                        }));
                        
                        const csv = [
                            Object.keys(csvData[0] || {}).join(','),
                            ...csvData.map(row => Object.values(row).join(','))
                        ].join('\n');
                        
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `consolidated-report-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    variant="primary"
                >
                    📊 Export Report
                </Button>
            </div>
            {/* Drill-down Drawer */}
            {drillAccount && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30" onClick={closeDrill}></div>
                    <div className="w-full sm:w-[480px] max-w-[90%] h-full bg-white shadow-xl border-l border-medium/40 flex flex-col animate-slide-in">
                        <div className="p-4 border-b border-medium/40 flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-deep-navy">{drillAccount.name}</h4>
                                <div className="text-xs text-deep-navy/60">Account {drillAccount.code}</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={closeDrill}>✖</Button>
                        </div>
                        <div className="p-3 text-xs text-deep-navy/60 border-b border-medium/30 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>{drillTxns.length} transaction{drillTxns.length === 1 ? '' : 's'} across {selectedCompanyIds.length} compan{selectedCompanyIds.length === 1 ? 'y' : 'ies'}</div>
                                {drillLoading && <div className="text-cobalt animate-pulse">Loading...</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-medium mb-1">Start</label>
                                    <input type="date" value={drillStart} onChange={e=>setDrillStart(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium mb-1">End</label>
                                    <input type="date" value={drillEnd} onChange={e=>setDrillEnd(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-medium mb-1">Source</label>
                                    <select value={drillSource} onChange={e=>setDrillSource(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs">
                                        <option value="all">All Sources</option>
                                        <option value="upload">Upload</option>
                                        <option value="manual">Manual</option>
                                        <option value="adjustment">Adjustment</option>
                                        <option value="integration">Integration</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {drillTxns
                              .filter(tx => !drillStart || tx.date >= drillStart)
                              .filter(tx => !drillEnd || tx.date <= drillEnd)
                              .filter(tx => drillSource === 'all' || tx.source === drillSource)
                              .map(tx => (
                                <div key={tx.id} className="p-3 rounded-lg border border-medium/40 bg-white/60 hover:bg-medium/10 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-medium text-sm">{tx.date}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-cobalt to-violet text-white">{tx.companyId}</div>
                                            {tx.source && <span className="text-[10px] px-1.5 py-0.5 rounded bg-medium/30 text-deep-navy/70 capitalize">{tx.source}</span>}
                                        </div>
                                    </div>
                                    <div className="text-xs text-deep-navy/70 mb-1 truncate">{tx.description || '—'}</div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex gap-3">
                                            <span className="text-emerald font-medium">{tx.debit ? formatCurrency(tx.debit) : ''}</span>
                                            <span className="text-coral font-medium">{tx.credit ? formatCurrency(tx.credit) : ''}</span>
                                        </div>
                                        {tx.currency !== reportingCurrency && (
                                            <div className="text-xs text-deep-navy/50">{tx.currency}{' '}{tx.originalDebit || tx.originalCredit}</div>
                                        )}
                                    </div>
                                </div>
                              ))}
                            {drillTxns.length === 0 && !drillLoading && (
                                <div className="text-center text-sm text-deep-navy/60 py-8">No transactions found for this account.</div>
                            )}
                        </div>
                        <div className="p-4 border-t border-medium/40 flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    // Simple CSV export of visible transactions
                                    const visible = drillTxns
                                      .filter(t => !drillStart || t.date >= drillStart)
                                      .filter(t => !drillEnd || t.date <= drillEnd)
                                      .filter(t => drillSource === 'all' || t.source === drillSource);
                                    const rows = visible.map(t => ({
                                        id: t.id,
                                        date: t.date,
                                        company: t.companyId,
                                        account: t.accountCode,
                                        description: t.description || '',
                                        debit: t.debit,
                                        credit: t.credit,
                                        currency: t.currency,
                                        originalDebit: t.originalDebit || '',
                                        originalCredit: t.originalCredit || ''
                                    }));
                                    if (!rows.length) return;
                                    const header = Object.keys(rows[0]).join(',');
                                    const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `transactions-${drillAccount.code}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                ⬇️ Export CSV
                            </Button>
                            <Button variant="primary" size="sm" onClick={closeDrill}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}