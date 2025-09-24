'use client';

import { create } from 'zustand';

export type OutboxItem = {
    id: string;
    to: string;
    subject: string;
    body?: string;
    href?: string; // optional deep link
    status: 'queued' | 'sent';
    ts: number;
};

type Store = {
    items: OutboxItem[];
    enqueue: (i: Omit<OutboxItem, 'id' | 'ts' | 'status'> & Partial<Pick<OutboxItem, 'id' | 'ts' | 'status'>>) => string;
    markSent: (id: string, sentAt?: number) => void;
    remove: (id: string) => void;
    clear: () => void;
};

const KEY = 'consultflow:outbox:v1';

function load(): OutboxItem[] {
    if (typeof window === 'undefined') return [];
    try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as OutboxItem[]) : []; } catch { return []; }
}
function save(items: OutboxItem[]) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { }
}
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export const useOutbox = create<Store>((set, get) => ({
    items: load(),
    enqueue: (i) => {
        const id = i.id ?? uid();
        const item: OutboxItem = {
            id,
            to: i.to,
            subject: i.subject,
            body: i.body,
            href: i.href,
            status: (i.status ?? 'queued') as OutboxItem['status'],
            ts: i.ts ?? Date.now()
        };
        const items = [item, ...get().items].slice(0, 200);
        set({ items }); save(items); return id;
    },
    markSent: (id, sentAt) => {
        const items: OutboxItem[] = get().items.map(x =>
            x.id === id
                ? ({ ...x, status: 'sent' as const, ts: sentAt ?? x.ts } as OutboxItem)
                : x
        );
        set({ items });
        save(items);
    },
    remove: (id) => { const items = get().items.filter(x => x.id !== id); set({ items }); save(items); },
    clear: () => { set({ items: [] }); save([]); }
}));

export default useOutbox;
