'use client';

import React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import ReportFilters from './components/ReportFilters';
import PLTableRow from './components/PLTableRow';
import DrillDownModal from './components/DrillDownModal';
import { useReportData, useReportFilters, usePLRows } from './hooks/useReportData';
import { liveDataService, DrillDownData } from './services/liveDataService';
import { useAppStore } from '@shared/state/app';
import * as XLSX from 'xlsx';

export interface ReportTableProps {
    className?: string;
    companyId?: string;
    range?: '30' | '90' | 'custom';
    from?: string;
    to?: string;
}

export default function ReportTable({ 
    className, 
    companyId = '', 
    range = '90', 
    from, 
    to 
}: ReportTableProps) {
    const { data, loading, error, formatCurrency } = useReportData(companyId, range, from, to);
    const { filters, updateFilters, clearFilters, toggleExpanded } = useReportFilters();
    const plRows = usePLRows(data, filters);
    const { selectedCompanyIds, consolidated } = useAppStore();
    
    const [drillDownData, setDrillDownData] = React.useState<DrillDownData | null>(null);
    const [isDrillDownOpen, setIsDrillDownOpen] = React.useState(false);
    const [companies, setCompanies] = React.useState<any[]>([]);
    
    // Load companies on mount
    React.useEffect(() => {
        liveDataService.getCompanies().then(setCompanies);
    }, []);

    const handleExportExcel = () => {
        if (!plRows.length) return;
        
        const exportData = plRows.map(row => ({
            'Account': row.label.trim(),
            'Amount': row.amount,
            'Type': row.type
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'P&L Statement');
        XLSX.writeFile(wb, `PL-Statement-${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    const handleDrillDown = async (accountCode: string, accountName: string) => {
        try {
            const dateFrom = from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const dateTo = to || new Date().toISOString().split('T')[0];
            
            const currentCompanyId = consolidated && selectedCompanyIds.length > 0 
                ? selectedCompanyIds[0] // Use first company for drill-down in consolidated view
                : companyId || companies[0]?.id || 'lagos-ng';
            
            const drillData = await liveDataService.getDrillDownData(
                currentCompanyId,
                accountCode,
                dateFrom,
                dateTo
            );
            
            setDrillDownData(drillData);
            setIsDrillDownOpen(true);
        } catch (error) {
            console.error('Failed to fetch drill-down data:', error);
        }
    };
    
    const getCurrentCompanyName = () => {
        const currentCompanyId = consolidated && selectedCompanyIds.length > 0
            ? selectedCompanyIds[0]
            : companyId || companies[0]?.id || 'lagos';
        
        const company = companies.find(c => c.id === currentCompanyId);
        return company?.name || 'Unknown Company';
    };

    if (loading) {
        return (
            <Card className={className}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-medium/40 rounded w-3/4"></div>
                    <div className="h-4 bg-medium/40 rounded w-1/2"></div>
                    <div className="h-4 bg-medium/40 rounded w-2/3"></div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <div className="text-center py-8">
                    <div className="text-coral mb-2">❌</div>
                    <p className="text-sm text-coral">{error}</p>
                    <Button 
                        size="sm" 
                        className="mt-3" 
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Profit & Loss Statement</h3>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleExportExcel}
                        >
                            📊 Export Excel
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <ReportFilters
                    filters={filters}
                    onUpdateFilters={updateFilters}
                    onClearFilters={clearFilters}
                />

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-medium/60">
                                <th className="text-left py-3 pr-4 font-semibold">Account</th>
                                <th className="text-right py-3 font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plRows.map((row) => (
                                <PLTableRow
                                    key={row.key}
                                    row={row}
                                    isExpanded={filters.expanded[row.key] || false}
                                    onToggleExpanded={toggleExpanded}
                                    formatCurrency={formatCurrency}
                                    onDrillDown={handleDrillDown}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {plRows.length === 0 && (
                    <div className="text-center py-8 text-deep-navy/60">
                        <div className="text-2xl mb-2">📊</div>
                        <p>No data matches your filters.</p>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="mt-2"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
            
            {/* Drill-Down Modal */}
            {drillDownData && (
                <DrillDownModal
                    isOpen={isDrillDownOpen}
                    onClose={() => {
                        setIsDrillDownOpen(false);
                        setDrillDownData(null);
                    }}
                    data={drillDownData}
                    companyName={getCurrentCompanyName()}
                    formatCurrency={formatCurrency}
                />
            )}
        </Card>
    );
}