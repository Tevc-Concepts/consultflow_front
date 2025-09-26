'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@components/ui/Card';
import ReportTable from '@shared/components/ReportTable';
import BalanceSheetTable from '@shared/components/BalanceSheetTable';
import CashflowTable from '@shared/components/CashflowTable';
import ConsolidatedReportsView from '@features/reports/components/ConsolidatedReportsView';
import AdjustmentsPanel from '@shared/components/AdjustmentsPanel';
import ApprovalStatusBadge from '@shared/components/ApprovalStatusBadge';
import ApprovalTimeline from '@shared/components/ApprovalTimeline';
import { useApprovals } from '@shared/state/approvals';
import { useAppStore } from '@shared/state/app';
import { liveDataService, CompanyData } from '@features/reports/services/liveDataService';

function ReportsPageInner() {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const rangeParam = (params.get('range') as '30' | '90' | 'custom' | null) ?? undefined;
    const from = params.get('from') ?? undefined;
    const to = params.get('to') ?? undefined;
    const tab = (params.get('tab') as 'pl' | 'bs' | 'cf' | 'consolidated' | null) || 'pl';
    const selectedCompany = params.get('company') || 'all';
    
    const role = useAppStore(s => s.role);
    const { reportingCurrency, setSelectedCompanyIds, setConsolidated } = useAppStore();
    
    const [mounted, setMounted] = React.useState(false);
    const [companies, setCompanies] = React.useState<CompanyData[]>([]);
    const [loadingCompanies, setLoadingCompanies] = React.useState(true);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);
    
    // Load companies on mount
    React.useEffect(() => {
        const loadCompanies = async () => {
            try {
                const companiesData = await liveDataService.getCompanies();
                setCompanies(companiesData);
            } catch (error) {
                console.error('Failed to load companies:', error);
            } finally {
                setLoadingCompanies(false);
            }
        };
        loadCompanies();
    }, []);
    
    // Update app state based on company selection
    React.useEffect(() => {
        if (selectedCompany === 'all') {
            setConsolidated(true);
            setSelectedCompanyIds(companies.map(c => c.id));
        } else {
            setConsolidated(false);
            setSelectedCompanyIds([selectedCompany]);
        }
    }, [selectedCompany, companies, setConsolidated, setSelectedCompanyIds]);
    
    const handleCompanyChange = (companyId: string) => {
        const newParams = new URLSearchParams(params.toString());
        newParams.set('company', companyId);
        router.push(`${pathname}?${newParams.toString()}`);
    };
    
    const isConsolidatedView = selectedCompany === 'all';
    
    const key = React.useMemo(() => {
        const co = isConsolidatedView ? 'ALL' : selectedCompany;
        const range = rangeParam ?? (from && to ? `${from}:${to}` : 'default');
        return `reports:${tab}:${co}:${range}`;
    }, [tab, isConsolidatedView, selectedCompany, rangeParam, from, to]);
    
    const getOrInit = useApprovals(s => s.getOrInit);
    const transition = useApprovals(s => s.transition);
    const status = useApprovals(React.useCallback(s => s.getStatus(key), [key]));
    const history = useApprovals(React.useCallback(s => s.getHistory(key), [key]));
    React.useEffect(() => { getOrInit(key, 'Draft'); }, [getOrInit, key]);

    const tabs = [
        { key: 'pl', label: 'P&L' },
        { key: 'bs', label: 'Balance Sheet' },
        { key: 'cf', label: 'Cash Flow' },
    ];

    return (
        <div className="space-y-4">
            {/* Header with Company Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-semibold text-deep-navy">Financial Reports</h1>
                
                {/* Company Selector */}
                <div className="flex items-center gap-3">
                    <label htmlFor="company-select" className="text-sm font-medium text-deep-navy/70">
                        Company:
                    </label>
                    <select
                        id="company-select"
                        value={selectedCompany}
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        className="rounded-xl border border-medium/60 px-3 py-2 text-sm min-w-[180px] focus:ring-2 focus:ring-cobalt focus:border-cobalt"
                        disabled={loadingCompanies}
                    >
                        <option value="all">🏢 All Companies (Consolidated)</option>
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.name} ({company.currency})
                            </option>
                        ))}
                    </select>
                    
                    {/* Currency Indicator */}
                    <div className="text-xs text-deep-navy/60 px-2 py-1 bg-medium/30 rounded-lg">
                        Reporting: {reportingCurrency}
                        {isConsolidatedView && companies.length > 1 && (
                            <span className="ml-1 text-amber-600">• FX Applied</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Type Selection - Only show when not consolidated */}
            {!isConsolidatedView && (
                <div className="inline-flex rounded-full border border-medium/60 p-0.5" role="tablist" aria-label="Report Type">
                    {tabs.map(({ key, label }) => (
                        <Link
                            key={key}
                            href={`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params.entries()), tab: key, company: selectedCompany }).toString()}`}
                            role="tab"
                            aria-selected={tab === key}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                tab === key 
                                    ? 'bg-cobalt text-white' 
                                    : 'text-deep-navy/70 hover:text-deep-navy hover:bg-medium/40'
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Report Content */}
            {isConsolidatedView ? (
                <ConsolidatedReportsView />
            ) : (
                <Card>
                    {/* Header with status and actions */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-deep-navy/70">Status</div>
                        <div className="flex items-center gap-2">
                            <ApprovalStatusBadge status={status as any} />
                            {role === 'Consultant' && (
                                <div className="inline-flex gap-2">
                                    {status === 'Draft' && (
                                        <button className="text-xs px-2 py-1 rounded-full bg-cobalt text-white hover:opacity-90" onClick={() => transition({ key, action: 'submit_for_review', by: 'Consultant' })}>Submit for Review</button>
                                    )}
                                    {status === 'AccountantReview' && (
                                        <>
                                            <button className="text-xs px-2 py-1 rounded-full bg-amber-500 text-white hover:opacity-90" onClick={() => transition({ key, action: 'send_to_client', by: 'Accountant' })}>Send to Client</button>
                                            <button className="text-xs px-2 py-1 rounded-full bg-coral text-white hover:opacity-90" onClick={() => transition({ key, action: 'request_changes', by: 'Accountant', comment: 'Needs corrections' })}>Request Changes</button>
                                        </>
                                    )}
                                    {status === 'ChangesRequested' && (
                                        <button className="text-xs px-2 py-1 rounded-full bg-cobalt text-white hover:opacity-90" onClick={() => transition({ key, action: 'submit_for_review', by: 'Consultant', comment: 'Addressed changes' })}>Resubmit</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {tab === 'pl' && (<>
                        <h2 className="text-lg font-semibold mb-2">Profit &amp; Loss</h2>
                        <ReportTable companyId={selectedCompany} range={rangeParam} from={from} to={to} />
                    </>)}
                    {tab === 'bs' && (<>
                        <h2 className="text-lg font-semibold mb-2">Balance Sheet</h2>
                        <BalanceSheetTable />
                    </>)}
                    {tab === 'cf' && (<>
                        <h2 className="text-lg font-semibold mb-2">Cash Flow</h2>
                        <CashflowTable />
                    </>)}
                    <div className="mt-4">
                        <div className="text-sm font-medium mb-1">Approval history</div>
                        <ApprovalTimeline items={history as any} />
                    </div>
                </Card>
            )}

            {/* Demo-only: Adjustments */}
            <AdjustmentsPanel />
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<Card><div className="text-sm text-deep-navy/70">Loading…</div></Card>}>
            <ReportsPageInner />
        </Suspense>
    );
}
