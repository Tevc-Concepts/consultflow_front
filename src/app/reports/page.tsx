'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@components/ui/Card';
import ReportTable from '@shared/components/ReportTable';
import BalanceSheetTable from '@shared/components/BalanceSheetTable';
import CashflowTable from '@shared/components/CashflowTable';
import AdjustmentsPanel from '@shared/components/AdjustmentsPanel';

function ReportsPageInner() {
    const params = useSearchParams();
    const pathname = usePathname();
    const rangeParam = (params.get('range') as '30' | '90' | 'custom' | null) ?? undefined;
    const from = params.get('from') ?? undefined;
    const to = params.get('to') ?? undefined;
    const tab = (params.get('tab') as 'pl' | 'bs' | 'cf' | null) || 'pl';
    return (
        <>
            <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-medium/60 p-0.5" role="tablist" aria-label="Report Type">
                    {[
                        { key: 'pl', label: 'P&L' },
                        { key: 'bs', label: 'Balance Sheet' },
                        { key: 'cf', label: 'Cash Flow' }
                    ].map((t) => {
                        const sp = new URLSearchParams(params.toString());
                        sp.set('tab', t.key);
                        const href = `${pathname}?${sp.toString()}`;
                        return (
                            <Link key={t.key} role="tab" aria-selected={tab === t.key} href={href} className={["px-3 py-1.5 text-sm rounded-full", tab === t.key ? 'bg-medium/60 text-deep-navy font-medium' : 'text-deep-navy/80 hover:bg-medium/40'].join(' ')}>
                                {t.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
            <Card className="mt-3">
                {tab === 'pl' && (<>
                    <h2 className="text-lg font-semibold mb-2">Profit &amp; Loss</h2>
                    <ReportTable range={rangeParam} from={from} to={to} />
                </>)}
                {tab === 'bs' && (<>
                    <h2 className="text-lg font-semibold mb-2">Balance Sheet</h2>
                    <BalanceSheetTable />
                </>)}
                {tab === 'cf' && (<>
                    <h2 className="text-lg font-semibold mb-2">Cash Flow</h2>
                    <CashflowTable />
                </>)}
            </Card>
        </>
    );
}

export default function ReportsPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-deep-navy">Reports</h1>
            </div>
            <Suspense fallback={<Card><div className="text-sm text-deep-navy/70">Loading…</div></Card>}>
                <ReportsPageInner />
            </Suspense>
            {/* Demo-only: Adjustments */}
            <AdjustmentsPanel />
        </div>
    );
}
