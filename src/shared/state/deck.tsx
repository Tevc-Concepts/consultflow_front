'use client';

import * as React from 'react';

export type SlideMode = 'CEO' | 'CFO';

export interface Slide {
    id: string;
    title: string;
    summary: string;
    bullets: string[];
    notes?: string[];
    mode?: SlideMode;
    companyId?: string;
    timeframe?: string;
    createdAt: number;
}

type DeckState = {
    slides: Slide[];
};

type DeckAction =
    | { type: 'ADD'; slide: Slide }
    | { type: 'REMOVE'; id: string }
    | { type: 'CLEAR' };

function reducer(state: DeckState, action: DeckAction): DeckState {
    switch (action.type) {
        case 'ADD':
            return { slides: [action.slide, ...state.slides] };
        case 'REMOVE':
            return { slides: state.slides.filter((s) => s.id !== action.id) };
        case 'CLEAR':
            return { slides: [] };
        default:
            return state;
    }
}

const DeckContext = React.createContext<{
    slides: Slide[];
    addSlide: (slide: Omit<Slide, 'id' | 'createdAt'>) => Slide;
    removeSlide: (id: string) => void;
    clear: () => void;
} | null>(null);

const STORAGE_KEY = 'consultflow:deck:v1';

function usePersistedReducer() {
    const [state, dispatch] = React.useReducer(reducer, undefined, () => {
        try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
            if (raw) return JSON.parse(raw) as DeckState;
        } catch { }
        return { slides: [] } as DeckState;
    });

    React.useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch { }
    }, [state]);

    return [state, dispatch] as const;
}

export function DeckProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = usePersistedReducer();

    const addSlide = React.useCallback((slide: Omit<Slide, 'id' | 'createdAt'>) => {
        const s: Slide = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now(), ...slide };
        dispatch({ type: 'ADD', slide: s });
        return s;
    }, [dispatch]);

    const removeSlide = React.useCallback((id: string) => dispatch({ type: 'REMOVE', id }), [dispatch]);
    const clear = React.useCallback(() => dispatch({ type: 'CLEAR' }), [dispatch]);

    const value = React.useMemo(() => ({ slides: state.slides, addSlide, removeSlide, clear }), [state.slides, addSlide, removeSlide, clear]);

    return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeck() {
    const ctx = React.useContext(DeckContext);
    if (!ctx) throw new Error('useDeck must be used within DeckProvider');
    return ctx;
}
