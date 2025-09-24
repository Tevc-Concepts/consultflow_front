'use client';

import { create } from 'zustand';
import { useNotifications } from './notifications';
import { useOutbox } from './outbox';

export type ApprovalState =
    | 'Draft'
    | 'AccountantReview'
    | 'ClientApproval'
    | 'Approved'
    | 'ChangesRequested';

export type ApprovalAction =
    | 'submit_for_review'
    | 'send_to_client'
    | 'approve'
    | 'request_changes'
    | 'reopen';

export type ApprovalHistoryItem = {
    id: string;
    from: ApprovalState;
    to: ApprovalState;
    action: ApprovalAction;
    by: string;
    comment?: string;
    ts: number;
};

export type Workflow = {
    key: string;
    status: ApprovalState;
    history: ApprovalHistoryItem[];
};

type Store = {
    workflows: Record<string, Workflow>;
    getOrInit: (key: string, initialState?: ApprovalState) => Workflow;
    getStatus: (key: string) => ApprovalState;
    getHistory: (key: string) => ApprovalHistoryItem[];
    transition: (args: { key: string; action: ApprovalAction; by: string; comment?: string }) => void;
    reset: (key: string) => void;
    clearAll: () => void;
};

const STORAGE_KEY = 'consultflow:approvals:v1';

function load(): Record<string, Workflow> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Record<string, Workflow>;
    } catch { }
    return {};
}

function save(workflows: Record<string, Workflow>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows)); } catch { }
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function nextState(current: ApprovalState, action: ApprovalAction): ApprovalState {
    switch (action) {
        case 'submit_for_review':
            return 'AccountantReview';
        case 'send_to_client':
            return 'ClientApproval';
        case 'approve':
            return 'Approved';
        case 'request_changes':
            return 'ChangesRequested';
        case 'reopen':
            return 'AccountantReview';
        default:
            return current;
    }
}

export const useApprovals = create<Store>((set, get) => ({
    workflows: load(),
    getOrInit: (key: string, initialState: ApprovalState = 'Draft') => {
        const s = get();
        if (!s.workflows[key]) {
            const wf: Workflow = { key, status: initialState, history: [] };
            const workflows = { ...s.workflows, [key]: wf };
            set({ workflows }); save(workflows);
            return wf;
        }
        return s.workflows[key];
    },
    getStatus: (key: string) => {
        const s = get();
        return s.workflows[key]?.status ?? 'Draft';
    },
    getHistory: (key: string) => {
        const s = get();
        return s.workflows[key]?.history ?? [];
    },
    transition: ({ key, action, by, comment }) => {
        const s = get();
        const current = s.workflows[key]?.status ?? 'Draft';
        const to = nextState(current, action);
        if (to === current) return; // no-op
        const evt: ApprovalHistoryItem = { id: uid(), from: current, to, action, by, comment, ts: Date.now() };
        const wf: Workflow = s.workflows[key]
            ? { ...s.workflows[key], status: to, history: [evt, ...s.workflows[key].history].slice(0, 200) }
            : { key, status: to, history: [evt] };
        const workflows = { ...s.workflows, [key]: wf };
        set({ workflows }); save(workflows);

        // Emit a notification for important transitions
        try {
            const add = useNotifications.getState().add;
            const enqueue = useOutbox.getState?.().enqueue;
            const titleMap: Record<ApprovalAction, string> = {
                submit_for_review: 'Submitted for review',
                send_to_client: 'Sent to client',
                approve: 'Report approved',
                request_changes: 'Changes requested',
                reopen: 'Reopened for review',
            };
            const kindMap: Partial<Record<ApprovalState, 'info' | 'success' | 'warning' | 'error'>> = {
                Approved: 'success',
                ClientApproval: 'info',
                AccountantReview: 'info',
                ChangesRequested: 'warning',
            };
            add({
                title: titleMap[action] ?? 'Approval updated',
                message: `${by} moved status: ${current} → ${to}${comment ? ` — ${comment}` : ''}`,
                kind: kindMap[to] ?? 'info',
            });

            // Optional: enqueue mock emails for demo
            if (enqueue) {
                if (action === 'send_to_client') {
                    enqueue({ to: 'client@example.com', subject: 'Report ready for your approval', body: 'A new report is ready. Please review and approve in Consultflow.', href: '/client' });
                }
                if (action === 'approve') {
                    enqueue({ to: 'consultant@example.com', subject: 'Client approved the report', body: `${by} approved the report.`, href: '/reports' });
                }
            }
        } catch { }
    },
    reset: (key: string) => {
        const s = get();
        const { [key]: _omit, ...rest } = s.workflows;
        const workflows = rest;
        set({ workflows }); save(workflows);
    },
    clearAll: () => { set({ workflows: {} }); save({}); }
}));

export default useApprovals;
