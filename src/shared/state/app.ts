'use client';

import { create, type StateCreator } from 'zustand';

export type Currency = 'NGN' | 'USD' | 'CFA';

export type FXRate = {
    // stored as base NGN -> quote currency rate, e.g., {USD: 1500} means 1 USD = 1500 NGN
    month: string; // YYYY-MM
    NGN_USD?: number;
    NGN_CFA?: number;
};

export type AppState = {
    // Data source selection is environment-driven; UI does not expose a switch now.
    dataSource?: 'sqlite' | 'frappe' | 'demo';
    demoMode: boolean;
    role: 'Consultant' | 'Client';
    reportingCurrency: Currency;
    consolidated: boolean;
    selectedCompanyIds: string[];
    onboardingComplete?: boolean;
    fx: FXRate[];
    setDataSource: (v: 'sqlite' | 'frappe' | 'demo') => void;
    setDemoMode: (v: boolean) => void;
    setRole: (r: 'Consultant' | 'Client') => void;
    setReportingCurrency: (c: Currency) => void;
    setConsolidated: (v: boolean) => void;
    setSelectedCompanyIds: (ids: string[]) => void;
    setFx: (fx: FXRate[]) => void;
    setOnboardingComplete: (v: boolean) => void;
};

const STORAGE_KEY = 'consultflow:app:v1';

function loadInitial(): Pick<AppState, 'dataSource' | 'demoMode' | 'role' | 'reportingCurrency' | 'consolidated' | 'selectedCompanyIds' | 'onboardingComplete'> {
    const defaultDataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE as any) || 'sqlite';
    if (typeof window === 'undefined') return { dataSource: defaultDataSource, demoMode: defaultDataSource === 'demo', role: 'Consultant', reportingCurrency: 'NGN', consolidated: false, selectedCompanyIds: [], onboardingComplete: false } as any;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return { dataSource: defaultDataSource, demoMode: defaultDataSource === 'demo', role: 'Consultant', reportingCurrency: 'NGN', consolidated: false, selectedCompanyIds: [], onboardingComplete: false } as any;
}

const initializer: StateCreator<AppState> = (set, get) => ({
    dataSource: 'sqlite',
    demoMode: false,
    role: (loadInitial() as any).role ?? 'Consultant',
    reportingCurrency: loadInitial().reportingCurrency,
    consolidated: loadInitial().consolidated,
    selectedCompanyIds: loadInitial().selectedCompanyIds,
    onboardingComplete: loadInitial().onboardingComplete,
    fx: [],
    setDataSource: (_v: 'sqlite' | 'frappe' | 'demo') => {
        // no-op at runtime; switching is now via env and app reload
    },
    setDemoMode: (_v: boolean) => {
        // no-op; demo mode disabled in UI
    },
    setRole: (r: 'Consultant' | 'Client') => { set({ role: r }); persist(); },
    setReportingCurrency: (c: Currency) => {
        set({ reportingCurrency: c });
        persist();
    },
    setConsolidated: (v: boolean) => {
        set({ consolidated: v });
        persist();
    },
    setSelectedCompanyIds: (ids: string[]) => {
        set({ selectedCompanyIds: ids });
        persist();
    },
    setFx: (fx: FXRate[]) => set({ fx })
    ,
    setOnboardingComplete: (v: boolean) => {
        set({ onboardingComplete: v });
        persist();
    }
});

export const useAppStore = create<AppState>(initializer);

function persist() {
    try {
        const { dataSource, demoMode, role, reportingCurrency, consolidated, selectedCompanyIds, onboardingComplete } = useAppStore.getState();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ dataSource, demoMode, role, reportingCurrency, consolidated, selectedCompanyIds, onboardingComplete }));
    } catch { }
}

export function convertAmount(amountNGN: number, currency: Currency, fx?: FXRate): number {
    if (currency === 'NGN') return amountNGN;
    const rate = currency === 'USD' ? fx?.NGN_USD : fx?.NGN_CFA;
    if (!rate || rate === 0) return amountNGN; // fallback
    // Convert NGN -> target currency
    return amountNGN / rate;
}

export function formatCurrency(amount: number, currency: Currency): string {
    try {
        const locale = currency === 'USD' ? 'en-US' : 'en-NG';
        return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
    } catch {
        const sym = currency === 'USD' ? '$' : currency === 'CFA' ? 'CFA ' : '₦';
        return `${sym}${Math.round(amount).toLocaleString()}`;
    }
}
