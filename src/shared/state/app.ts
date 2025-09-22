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
    demoMode: boolean;
    reportingCurrency: Currency;
    consolidated: boolean;
    selectedCompanyIds: string[];
    onboardingComplete?: boolean;
    fx: FXRate[];
    setDemoMode: (v: boolean) => void;
    setReportingCurrency: (c: Currency) => void;
    setConsolidated: (v: boolean) => void;
    setSelectedCompanyIds: (ids: string[]) => void;
    setFx: (fx: FXRate[]) => void;
    setOnboardingComplete: (v: boolean) => void;
};

const STORAGE_KEY = 'consultflow:app:v1';

function loadInitial(): Pick<AppState, 'demoMode' | 'reportingCurrency' | 'consolidated' | 'selectedCompanyIds' | 'onboardingComplete'> {
    if (typeof window === 'undefined') return { demoMode: true, reportingCurrency: 'NGN', consolidated: false, selectedCompanyIds: [], onboardingComplete: false };
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return { demoMode: true, reportingCurrency: 'NGN', consolidated: false, selectedCompanyIds: [], onboardingComplete: false };
}

const initializer: StateCreator<AppState> = (set, get) => ({
    demoMode: loadInitial().demoMode,
    reportingCurrency: loadInitial().reportingCurrency,
    consolidated: loadInitial().consolidated,
    selectedCompanyIds: loadInitial().selectedCompanyIds,
    onboardingComplete: loadInitial().onboardingComplete,
    fx: [],
    setDemoMode: (v: boolean) => {
        set({ demoMode: v });
        persist();
    },
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
        const { demoMode, reportingCurrency, consolidated, selectedCompanyIds, onboardingComplete } = useAppStore.getState();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ demoMode, reportingCurrency, consolidated, selectedCompanyIds, onboardingComplete }));
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
