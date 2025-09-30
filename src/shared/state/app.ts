'use client';

import { create, type StateCreator } from 'zustand';

export type Currency = 'NGN' | 'USD' | 'CFA' | 'KES' | 'ZAR' | 'GHS' | 'MAD';

export type FXRate = {
    // Historical monthly snapshot; we keep a per-USD map for multiple currencies when available
    month: string; // YYYY-MM
    NGN_USD?: number;
    KES_USD?: number;
    ZAR_USD?: number;
    GHS_USD?: number;
    MAD_USD?: number;
    CFA_USD?: number;
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

import { convertCurrency as convertCurrencyUtil } from '@shared/utils/fx';

export function convertAmount(amountInNGN: number, currency: Currency, fx?: FXRate): number {
    // Backwards compatible helper specifically for NGN -> target
    if (currency === 'NGN') return amountInNGN;
    const perUsd = fx ? {
        NGN_USD: fx.NGN_USD,
        KES_USD: fx.KES_USD,
        ZAR_USD: fx.ZAR_USD,
        GHS_USD: fx.GHS_USD,
        MAD_USD: fx.MAD_USD,
        CFA_USD: fx.CFA_USD,
    } : undefined;
    // Convert NGN -> target using the general converter
    return convertCurrencyUtil(amountInNGN, 'NGN', currency, perUsd as any);
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
