'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@components/ui/Card';
import ReportTable from '@shared/components/ReportTable';

function ReportsPageInner() {
    const params = useSearchParams();
    const rangeParam = (params.get('range') as '30' | '90' | 'custom' | null) ?? undefined;
    const from = params.get('from') ?? undefined;
    const to = params.get('to') ?? undefined;
    return (
        <Card>
            <h2 className="text-lg font-semibold mb-2">Profit &amp; Loss</h2>
            <ReportTable range={rangeParam} from={from} to={to} />
        </Card>
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
        </div>
    );
}
