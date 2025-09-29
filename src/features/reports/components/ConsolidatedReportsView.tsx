'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useAppStore } from '@shared/state/app';
import getApi from '@shared/api/client';
import RechartsBarChart from '@shared/components/BarChart';

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
        } finally {
            setLoading(false);
        }
    }, [loadCompanyBreakdowns, reportingCurrency]);

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
                    <div className="text-right">
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
                                <tr key={account.account_code} className="border-b border-medium/40 hover:bg-medium/20">
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
        </div>
    );
}