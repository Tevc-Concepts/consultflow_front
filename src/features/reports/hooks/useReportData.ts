'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import getApi from '@shared/api/client';
import { useAppStore, convertAmount, formatCurrency as formatCurrencyUtil } from '@shared/state/app';
import { ReportsResponse, Transaction, PLRow, ReportFilters } from '../types';
import { accountingRepository, computePLFromTB } from '@shared/repositories/accountingRepository';

function uid() { 
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useReportData(companyId = '', range = '90', from?: string, to?: string) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ReportsResponse | null>(null);
    const reportingCurrency = useAppStore(s => s.reportingCurrency);

    const formatCurrency = useCallback((amount: number) => {
        return formatCurrencyUtil(convertAmount(amount, reportingCurrency, undefined), reportingCurrency);
    }, [reportingCurrency]);

    useEffect(() => {
        let mounted = true;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1) Prefer Trial Balance + CoA if available (demo-ready, API-ready)
                accountingRepository.seedDemo();
                const cid = companyId || 'lagos-ng';
                const tbs = accountingRepository.listTB(cid).sort((a,b) => a.periodEnd.localeCompare(b.periodEnd));
                const latest = tbs[tbs.length - 1];
                const coa = accountingRepository.listCoA(cid);
                if (latest && coa.length) {
                    const pl = computePLFromTB(coa, latest);
                    const resp: ReportsResponse = {
                        series: [ { date: latest.periodEnd, revenue: pl.revenue, cogs: pl.cogs, expenses: pl.opex, cash: 0 } ]
                    } as any;
                    if (mounted) { setData(resp); setLoading(false); }
                    return;
                }

                // 2) Fallback to existing API endpoints
                const api = getApi();
                const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'localDb';
                const endpoint = dataSource === 'demo' ? '/api/demo/reports' : 
                               dataSource === 'localDb' ? '/api/local/reports' : 
                               '/api/reports'; // frappe endpoint
                const response = await api.get<ReportsResponse>(endpoint, {
                    params: { company: companyId, range, from, to, currency: reportingCurrency }
                });
                if (mounted) { setData(response.data); }
            } catch (err: any) {
                if (mounted) {
                    // Fallback to TB+CoA local computation
                    try {
                        accountingRepository.seedDemo();
                        const tbs = accountingRepository.listTB(companyId || 'lagos-ng');
                        const latest = tbs.sort((a,b) => a.periodEnd.localeCompare(b.periodEnd)).slice(-1)[0];
                        const coa = accountingRepository.listCoA(companyId || 'lagos-ng');
                        if (latest && coa.length) {
                            const pl = computePLFromTB(coa, latest);
                            const fake: ReportsResponse = {
                                series: [
                                    { date: latest.periodEnd, revenue: pl.revenue, cogs: pl.cogs, expenses: pl.opex, cash: 0 }
                                ]
                            } as any;
                            setData(fake);
                            setError(null);
                        } else {
                            setError(err?.message ?? 'Failed to load data');
                        }
                    } catch (e) {
                        setError(err?.message ?? 'Failed to load data');
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        
        return () => { mounted = false; };
    }, [companyId, range, from, to, reportingCurrency]);

    return { data, loading, error, formatCurrency };
}

export function useReportFilters() {
    const [filters, setFilters] = useState<ReportFilters>({
        query: '',
        minAmount: '',
        maxAmount: '',
        account: 'All',
        type: 'All',
        expanded: {}
    });

    const updateFilters = useCallback((updates: Partial<ReportFilters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            query: '',
            minAmount: '',
            maxAmount: '',
            account: 'All',
            type: 'All',
            expanded: {}
        });
    }, []);

    const toggleExpanded = useCallback((key: string) => {
        setFilters(prev => ({
            ...prev,
            expanded: {
                ...prev.expanded,
                [key]: !prev.expanded[key]
            }
        }));
    }, []);

    return {
        filters,
        updateFilters,
        clearFilters,
        toggleExpanded
    };
}

export function usePLRows(data: ReportsResponse | null, filters: ReportFilters) {
    return useMemo(() => {
        if (!data || !data.series || data.series.length === 0) {
            return [];
        }

        // Generate mock transactions
        const transactions: Transaction[] = [];
        data.series.forEach(point => {
            // Revenue transactions
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'Sales',
                description: 'Product Sales',
                amount: point.revenue * 0.7,
                type: 'Revenue'
            });
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'Sales',
                description: 'Service Revenue',
                amount: point.revenue * 0.3,
                type: 'Revenue'
            });

            // COGS transactions
            const cogs = point.cogs || point.revenue * 0.4;
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'COGS',
                description: 'Direct Materials',
                amount: cogs * 0.6,
                type: 'COGS'
            });
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'COGS',
                description: 'Direct Labor',
                amount: cogs * 0.4,
                type: 'COGS'
            });

            // Expense transactions
            const remainingExpenses = point.expenses - cogs;
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'Payroll',
                description: 'Salaries & Benefits',
                amount: remainingExpenses * 0.5,
                type: 'Expense'
            });
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'Rent',
                description: 'Office Rent',
                amount: remainingExpenses * 0.2,
                type: 'Expense'
            });
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'Marketing',
                description: 'Marketing & Advertising',
                amount: remainingExpenses * 0.2,
                type: 'Expense'
            });
            transactions.push({
                id: uid(),
                date: point.date,
                account: 'Other',
                description: 'General & Administrative',
                amount: remainingExpenses * 0.1,
                type: 'Expense'
            });
        });

        // Filter transactions
        const filteredTransactions = transactions.filter(txn => {
            if (filters.query && !txn.description.toLowerCase().includes(filters.query.toLowerCase())) {
                return false;
            }
            
            if (filters.minAmount && txn.amount < parseFloat(filters.minAmount)) {
                return false;
            }
            
            if (filters.maxAmount && txn.amount > parseFloat(filters.maxAmount)) {
                return false;
            }
            
            if (filters.account !== 'All' && txn.account !== filters.account) {
                return false;
            }
            
            if (filters.type !== 'All' && txn.type !== filters.type) {
                return false;
            }
            
            return true;
        });

        // Aggregate into P&L rows
        const rows: PLRow[] = [];
        
        // Revenue
        const revenueTotal = filteredTransactions
            .filter(t => t.type === 'Revenue')
            .reduce((sum, t) => sum + t.amount, 0);
        
        rows.push({
            key: 'revenue',
            label: 'Revenue',
            amount: revenueTotal,
            type: 'Revenue',
            expandable: true
        });

        if (filters.expanded['revenue']) {
            const salesTotal = filteredTransactions
                .filter(t => t.type === 'Revenue' && t.account === 'Sales')
                .reduce((sum, t) => sum + t.amount, 0);
            
            rows.push({
                key: 'sales',
                label: '  Product & Service Sales',
                amount: salesTotal,
                type: 'Revenue',
                account: 'Sales'
            });
        }

        // COGS
        const cogsTotal = filteredTransactions
            .filter(t => t.type === 'COGS')
            .reduce((sum, t) => sum + t.amount, 0);
        
        rows.push({
            key: 'cogs',
            label: 'Cost of Goods Sold',
            amount: -cogsTotal,
            type: 'COGS',
            expandable: true
        });

        if (filters.expanded['cogs']) {
            const materialsTotal = filteredTransactions
                .filter(t => t.type === 'COGS' && t.description.includes('Materials'))
                .reduce((sum, t) => sum + t.amount, 0);
            
            const laborTotal = filteredTransactions
                .filter(t => t.type === 'COGS' && t.description.includes('Labor'))
                .reduce((sum, t) => sum + t.amount, 0);
            
            rows.push({
                key: 'materials',
                label: '  Direct Materials',
                amount: -materialsTotal,
                type: 'COGS'
            });
            
            rows.push({
                key: 'labor',
                label: '  Direct Labor',
                amount: -laborTotal,
                type: 'COGS'
            });
        }

        // Gross Profit
        rows.push({
            key: 'gross-profit',
            label: 'Gross Profit',
            amount: revenueTotal - cogsTotal,
            type: 'Computed'
        });

        // Operating Expenses
        const expenseTotal = filteredTransactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        rows.push({
            key: 'expenses',
            label: 'Operating Expenses',
            amount: -expenseTotal,
            type: 'Expense',
            expandable: true
        });

        if (filters.expanded['expenses']) {
            ['Payroll', 'Rent', 'Marketing', 'Other'].forEach(account => {
                const accountTotal = filteredTransactions
                    .filter(t => t.type === 'Expense' && t.account === account)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                if (accountTotal > 0) {
                    rows.push({
                        key: account.toLowerCase(),
                        label: `  ${account}`,
                        amount: -accountTotal,
                        type: 'Expense',
                        account: account as Transaction['account']
                    });
                }
            });
        }

        // Net Income
        rows.push({
            key: 'net-income',
            label: 'Net Income',
            amount: revenueTotal - cogsTotal - expenseTotal,
            type: 'Computed'
        });

        return rows;
    }, [data, filters]);
}