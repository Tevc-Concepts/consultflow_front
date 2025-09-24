'use client';

import * as React from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import PLPreview from '@shared/components/PLPreview';
import { useNotifications } from '@shared/state/notifications';
import { useApprovals } from '@shared/state/approvals';
import { useAppStore } from '@shared/state/app';
import ApprovalStatusBadge from '@shared/components/ApprovalStatusBadge';
import ApprovalTimeline from '@shared/components/ApprovalTimeline';

type Client = { id: string; name: string; org: string; email: string };
type Report = { id: string; title: string; period: string; kind: 'P&L' | 'Balance Sheet' | 'Cash Flow'; };
type Comment = { id: string; author: string; text: string; ts: number };
type Permissions = { viewOnly: boolean; canComment: boolean };
// Approvals are handled via shared approvals store

const demoClients: Client[] = [
    { id: 'c-1', name: 'Jane Doe', org: 'Acme Ltd', email: 'jane@acme.com' },
    { id: 'c-2', name: 'Tunde A.', org: 'Naija Foods', email: 'tunde@naijafoods.ng' },
    { id: 'c-3', name: 'Lara O.', org: 'KoboPay', email: 'lara@kobopay.africa' },
];

const sharedReportsByClient: Record<string, Report[]> = {
    'c-1': [
        { id: 'r-11', title: 'P&L — Q2 2025', period: 'Apr–Jun 2025', kind: 'P&L' },
        { id: 'r-12', title: 'Cash Flow — Q2 2025', period: 'Apr–Jun 2025', kind: 'Cash Flow' },
    ],
    'c-2': [
        { id: 'r-21', title: 'P&L — H1 2025', period: 'Jan–Jun 2025', kind: 'P&L' },
        { id: 'r-22', title: 'Balance Sheet — Jun 2025', period: 'As of Jun 30, 2025', kind: 'Balance Sheet' },
    ],
    'c-3': [
        { id: 'r-31', title: 'P&L — May 2025', period: 'May 2025', kind: 'P&L' },
    ],
};

const STORAGE_KEY = 'consultflow:client-portal:v1';

type Store = {
    permissions: Record<string, Permissions>; // key: clientId
    comments: Record<string, Comment[]>;      // key: `${clientId}:${reportId}`
};

function usePortalStore() {
    const [store, setStore] = React.useState<Store>(() => {
        if (typeof window === 'undefined') return { permissions: {}, comments: {} } as Store;
        try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as Store; } catch { }
        return { permissions: {}, comments: {} } as Store;
    });
    React.useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { } }, [store]);
    return [store, setStore] as const;
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function ClientPortalPage() {
    const [store, setStore] = usePortalStore();
    const notify = useNotifications(s => s.add);
    const role = useAppStore(s => s.role);
    const approvals = useApprovals();
    const [selectedClientId, setSelectedClientId] = React.useState<string | null>(demoClients[0]?.id ?? null);
    const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
    const [slideOpen, setSlideOpen] = React.useState(false);

    const clients = demoClients;
    const client = clients.find(c => c.id === selectedClientId) || null;
    const reports = client ? (sharedReportsByClient[client.id] ?? []) : [];
    const report = reports.find(r => r.id === selectedReportId) || null;

    const perms: Permissions = React.useMemo(() => store.permissions[client?.id ?? ''] ?? { viewOnly: false, canComment: true }, [store.permissions, client?.id]);
    const commentsKey = client && report ? `${client.id}:${report.id}` : '';
    const comments = (commentsKey && store.comments[commentsKey]) ? store.comments[commentsKey] : [];
    const approvalKey = client && report ? `client:${client.id}:${report.id}` : '';
    const status = approvalKey ? approvals.getStatus(approvalKey) : 'Draft';
    const history = approvalKey ? approvals.getHistory(approvalKey) : [];
    React.useEffect(() => { if (approvalKey) approvals.getOrInit(approvalKey, 'ClientApproval'); }, [approvals, approvalKey]);

    function updatePerms(next: Partial<Permissions>) {
        if (!client) return;
        setStore(s => ({ ...s, permissions: { ...s.permissions, [client.id]: { ...(s.permissions[client.id] ?? { viewOnly: false, canComment: true }), ...next } } }));
    }

    function addComment(author: string, text: string) {
        if (!client || !report) return;
        const key = `${client.id}:${report.id}`;
        const item: Comment = { id: uid(), author: author.trim() || client.name, text: text.trim(), ts: Date.now() };
        setStore(s => ({ ...s, comments: { ...s.comments, [key]: [...(s.comments[key] ?? []), item] } }));
    }

    function approve(name: string) {
        if (!client || !report || !approvalKey) return;
        const approver = name.trim() || client.name;
        approvals.transition({ key: approvalKey, action: 'approve', by: approver });
        notify({ title: 'Report approved', message: `${report.title} approved by ${approver}`, kind: 'success' });
    }

    function requestChanges(comment: string) {
        if (!client || !report || !approvalKey) return;
        const by = client.name;
        approvals.transition({ key: approvalKey, action: 'request_changes', by, comment });
        notify({ title: 'Changes requested', message: `${report.title}: ${comment || 'Please review and revise.'}`, kind: 'warning' });
    }

    // Mobile slide-over: open detail on small screens when selecting a client
    function closeDetail() { setSlideOpen(false); }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] gap-4">
            {/* Left: Clients list */}
            <Card className="md:sticky md:top-4 h-max">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-lg font-semibold">Client Portal</h1>
                </div>
                <ul className="divide-y divide-medium/60">
                    {clients.map((c) => {
                        const count = (sharedReportsByClient[c.id] ?? []).length;
                        const active = selectedClientId === c.id;
                        return (
                            <li key={c.id}>
                                <button
                                    className={[
                                        'w-full text-left px-3 py-2 flex items-center justify-between rounded-xl hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt',
                                        active ? 'bg-medium/60' : ''
                                    ].join(' ')}
                                    onClick={() => {
                                        setSelectedClientId(c.id);
                                        setSelectedReportId(null);
                                        if (window.matchMedia('(max-width: 767px)').matches) setSlideOpen(true);
                                    }}
                                >
                                    <div>
                                        <div className="font-medium">{c.name} • {c.org}</div>
                                        <div className="text-xs text-deep-navy/70">{c.email}</div>
                                    </div>
                                    <div className="text-xs text-deep-navy/70">{count} shared</div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Card>

            {/* Right: Detail panel (desktop inline, mobile slide-over) */}
            <div className="relative">
                <div className="hidden md:block">
                    <DetailPanel
                        client={client}
                        reports={reports}
                        report={report}
                        onSelectReport={setSelectedReportId}
                        comments={comments}
                        canComment={!perms.viewOnly && perms.canComment}
                        addComment={addComment}
                        perms={perms}
                        onPermsChange={updatePerms}
                        status={status}
                        history={history}
                        canApprove={role === 'Client' && status === 'ClientApproval'}
                        onApprove={approve}
                        onRequestChanges={requestChanges}
                    />
                </div>

                {/* Slide-over */}
                <div className={[
                    'md:hidden fixed inset-0 z-40 transition-transform duration-200',
                    slideOpen ? 'translate-x-0' : 'translate-x-full'
                ].join(' ')} aria-hidden={!slideOpen}>
                    <div className="absolute inset-0 bg-black/20" onClick={closeDetail} />
                    <div className="absolute right-0 top-0 bottom-0 w-[92%] max-w-[640px] bg-white shadow-xl p-3 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-deep-navy/70">Client detail</div>
                            <Button size="sm" variant="ghost" onClick={closeDetail}>Close</Button>
                        </div>
                        <DetailPanel
                            client={client}
                            reports={reports}
                            report={report}
                            onSelectReport={(id: string) => { setSelectedReportId(id); }}
                            comments={comments}
                            canComment={!perms.viewOnly && perms.canComment}
                            addComment={addComment}
                            perms={perms}
                            onPermsChange={updatePerms}
                            status={status}
                            history={history}
                            canApprove={role === 'Client' && status === 'ClientApproval'}
                            onApprove={approve}
                            onRequestChanges={requestChanges}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

type DetailPanelProps = {
    client: Client | null;
    reports: Report[];
    report: Report | null;
    onSelectReport: (id: string) => void;
    comments: Comment[];
    canComment: boolean;
    addComment: (author: string, text: string) => void;
    perms: Permissions;
    onPermsChange: (next: Partial<Permissions>) => void;
    status: string;
    history: any[];
    canApprove: boolean;
    onApprove: (name: string) => void;
    onRequestChanges: (comment: string) => void;
};

function DetailPanel({ client, reports, report, onSelectReport, comments, canComment, addComment, perms, onPermsChange, status, history, canApprove, onApprove, onRequestChanges }: DetailPanelProps) {
    const [author, setAuthor] = React.useState('');
    const [text, setText] = React.useState('');
    const [approvalName, setApprovalName] = React.useState('');
    const [changeComment, setChangeComment] = React.useState('');

    if (!client) return (
        <Card>
            <div className="text-sm text-deep-navy/70">Select a client to view shared reports.</div>
        </Card>
    );

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{client.name}</h2>
                        <div className="text-sm text-deep-navy/70">{client.org} • {client.email}</div>
                    </div>
                    <div className="text-xs text-deep-navy/70">Permissions</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={perms.viewOnly} onChange={(e) => onPermsChange({ viewOnly: e.target.checked })} />
                        View-only
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={perms.canComment} onChange={(e) => onPermsChange({ canComment: e.target.checked })} />
                        Can comment
                    </label>
                </div>
            </Card>

            <Card>
                <h3 className="text-base font-semibold mb-2">Shared reports</h3>
                {reports.length === 0 ? (
                    <div className="text-sm text-deep-navy/70">No reports shared yet.</div>
                ) : (
                    <ul className="divide-y divide-medium/60">
                        {reports.map(r => {
                            const active = report?.id === r.id;
                            return (
                                <li key={r.id}>
                                    <button
                                        onClick={() => onSelectReport(r.id)}
                                        className={['w-full text-left px-3 py-2 rounded-xl hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt', active ? 'bg-medium/60' : ''].join(' ')}
                                    >
                                        <div className="font-medium">{r.title}</div>
                                        <div className="text-xs text-deep-navy/70">{r.period} • {r.kind}</div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            <Card>
                <h3 className="text-base font-semibold mb-2">Report detail</h3>
                {!report ? (
                    <div className="text-sm text-deep-navy/70">Select a report to view comments and approval.</div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <div className="text-lg font-semibold">{report.title}</div>
                            <div className="text-sm text-deep-navy/70">{report.period} • {report.kind}</div>
                        </div>

                        {report.kind === 'P&L' && (
                            <PLPreview periodLabel={report.period} />
                        )}

                        {/* Approval */}
                        <div className="rounded-xl border border-medium/60 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Approval</div>
                                <ApprovalStatusBadge status={status as any} />
                            </div>
                            {canApprove && (
                                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                    <input placeholder="Your name" value={approvalName} onChange={(e) => setApprovalName(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm flex-1" />
                                    <Button size="sm" onClick={() => onApprove(approvalName)} disabled={perms.viewOnly}>Approve</Button>
                                </div>
                            )}
                            {status === 'ClientApproval' && (
                                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                    <input placeholder="Request changes (optional)" value={changeComment} onChange={(e) => setChangeComment(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm flex-1" />
                                    <Button size="sm" variant="ghost" onClick={() => onRequestChanges(changeComment)} disabled={perms.viewOnly}>Request Changes</Button>
                                </div>
                            )}
                            <div className="mt-3">
                                <div className="text-sm font-medium mb-1">History</div>
                                <ApprovalTimeline items={history as any} />
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="rounded-xl border border-medium/60 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Comments</div>
                                {!canComment && <div className="text-xs text-deep-navy/60">Comments disabled</div>}
                            </div>
                            <div className="mt-2 space-y-2 max-h-64 overflow-auto">
                                {comments.length === 0 ? (
                                    <div className="text-sm text-deep-navy/70">No comments yet.</div>
                                ) : (
                                    comments.map(cm => (
                                        <div key={cm.id} className="rounded-lg border border-medium/60 p-2">
                                            <div className="text-xs text-deep-navy/60">{cm.author} • {new Date(cm.ts).toLocaleString()}</div>
                                            <div className="text-sm">{cm.text}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                <input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm flex-1" disabled={!canComment} />
                                <input placeholder="Add a comment" value={text} onChange={(e) => setText(e.target.value)} className="rounded-xl border border-medium/60 px-3 py-2 text-sm flex-[2]" disabled={!canComment} />
                                <Button size="sm" onClick={() => { if (text.trim()) { addComment(author, text); setText(''); } }} disabled={!canComment}>Post</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
