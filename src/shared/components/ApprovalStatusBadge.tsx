import * as React from 'react';
import { ApprovalState } from '@shared/state/approvals';

export default function ApprovalStatusBadge({ status, className = '' }: { status: ApprovalState; className?: string }) {
    const { label, cls } = React.useMemo(() => {
        switch (status) {
            case 'Draft':
                return { label: 'Draft', cls: 'bg-medium/60 text-deep-navy' };
            case 'AccountantReview':
                return { label: 'Accountant Review', cls: 'bg-cobalt/10 text-cobalt border border-cobalt/30' };
            case 'ClientApproval':
                return { label: 'Client Approval', cls: 'bg-amber/10 text-amber border border-amber/30' };
            case 'Approved':
                return { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' };
            case 'ChangesRequested':
                return { label: 'Changes Requested', cls: 'bg-coral/10 text-coral border border-coral/30' };
            default:
                return { label: String(status), cls: 'bg-medium/60 text-deep-navy' };
        }
    }, [status]);

    return (
        <span data-testid="approval-status-badge" className={[
            'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
            cls,
            className
        ].join(' ')}>{label}</span>
    );
}
