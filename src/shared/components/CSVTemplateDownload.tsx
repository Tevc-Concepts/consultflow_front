'use client';

import * as React from 'react';

type TemplateKind = 'transactions' | 'invoices' | 'payroll' | 'coa' | 'trial_balance';

export interface CSVTemplateDownloadProps {
    className?: string;
}

export default function CSVTemplateDownload({ className }: CSVTemplateDownloadProps) {
    const [kind, setKind] = React.useState<TemplateKind>('transactions');

    const onDownload = () => {
        const url = `/api/local/upload/template?type=${encodeURIComponent(kind)}`;
        // Use a hidden anchor to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <div className={["flex items-center gap-2", className].filter(Boolean).join(' ')}>
            <label htmlFor="tpl-kind" className="text-sm text-deep-navy/90">Template</label>
            <select
                id="tpl-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as TemplateKind)}
                className="rounded-xl border border-medium/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                aria-label="Select CSV template type"
            >
                <option value="transactions">Transactions</option>
                <option value="invoices">Invoices</option>
                <option value="payroll">Payroll</option>
                <option value="coa">Chart of Accounts</option>
                <option value="trial_balance">Trial Balance</option>
            </select>
            <button
                onClick={onDownload}
                className="rounded-full bg-gradient-to-r from-deep-navy to-cobalt px-3 py-2 text-sm font-medium text-white shadow-soft hover:shadow-hover focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2"
                aria-label="Download CSV template"
            >
                Download template
            </button>
        </div>
    );
}

export { CSVTemplateDownload };
