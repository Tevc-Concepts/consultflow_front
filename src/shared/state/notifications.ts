'use client';

import { create } from 'zustand';

export type Notification = {
    id: string;
    title: string;
    message?: string;
    kind?: 'success' | 'info' | 'warning' | 'error';
    ts: number;
    read?: boolean;
    action?: { label: string; href?: string; onClick?: () => void };
};

type Store = {
    items: Notification[];
    add: (n: Omit<Notification, 'id' | 'ts' | 'read'> & Partial<Pick<Notification, 'id' | 'ts' | 'read'>>) => string;
    dismiss: (id: string) => void;
    markRead: (id: string, read?: boolean) => void;
    clear: () => void;
};

const KEY = 'consultflow:notifications:v1';

function load(): Notification[] {
    if (typeof window === 'undefined') return [];
    try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Notification[]) : []; } catch { return []; }
}
function save(items: Notification[]) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { }
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export const useNotifications = create<Store>((set, get) => ({
    items: load(),
    add: (n) => {
        const id = n.id ?? uid();
        const item: Notification = { id, ts: n.ts ?? Date.now(), read: n.read ?? false, title: n.title, message: n.message, kind: n.kind ?? 'info', action: n.action };
        const items = [item, ...get().items].slice(0, 50);
        set({ items }); save(items); return id;
    },
    dismiss: (id) => { const items = get().items.filter(i => i.id !== id); set({ items }); save(items); },
    markRead: (id, read = true) => { const items = get().items.map(i => i.id === id ? { ...i, read } : i); set({ items }); save(items); },
    clear: () => { set({ items: [] }); save([]); }
}));

export default useNotifications;
