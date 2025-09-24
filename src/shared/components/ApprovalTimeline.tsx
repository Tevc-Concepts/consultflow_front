import * as React from 'react';
import { ApprovalHistoryItem } from '@shared/state/approvals';

export default function ApprovalTimeline({ items }: { items: ApprovalHistoryItem[] }) {
    if (!items || items.length === 0) {
        return <div className="text-sm text-deep-navy/70">No history yet.</div>;
    }
    return (
        <ol data-testid="approval-timeline" className="space-y-2">
            {items.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-medium/60 p-2">
                    <div className="text-xs text-deep-navy/60">
                        {new Date(ev.ts).toLocaleString()} • {ev.by}
                    </div>
                    <div className="text-sm">
                        {ev.action.replaceAll('_', ' ')}: {ev.from} → {ev.to}
                    </div>
                    {ev.comment && <div className="text-xs text-deep-navy/70 mt-1">“{ev.comment}”</div>}
                </li>
            ))}
        </ol>
    );
}
