export type FxPerUsd = {
  // units of currency per 1 USD
  NGN_USD?: number;
  KES_USD?: number;
  ZAR_USD?: number;
  GHS_USD?: number;
  MAD_USD?: number;
  // optional extras
  CFA_USD?: number;
};

export type FxRecord = {
  month: string; // YYYY-MM
  rates: Record<string, number>;
};

export function normalizeRates(input?: { rates?: Record<string, number> } | null): FxPerUsd | null {
  if (!input || !input.rates) return null;
  const r = input.rates;
  const out: FxPerUsd = {};
  // direct per USD if present
  if (isFiniteNum(r.NGN_USD)) out.NGN_USD = r.NGN_USD;
  if (isFiniteNum(r.KES_USD)) out.KES_USD = r.KES_USD;
  if (isFiniteNum(r.ZAR_USD)) out.ZAR_USD = r.ZAR_USD;
  if (isFiniteNum(r.GHS_USD)) out.GHS_USD = r.GHS_USD;
  if (isFiniteNum(r.MAD_USD)) out.MAD_USD = r.MAD_USD;
  if (isFiniteNum(r.CFA_USD)) out.CFA_USD = r.CFA_USD;
  // derive missing per-USD using cross pairs when available
  // Example pairs in API: NGN_ZAR (NGN per ZAR), KES_NGN (KES per NGN), GHS_MAD (GHS per MAD)
  if (!out.ZAR_USD && isFiniteNum(r.NGN_ZAR) && isFiniteNum(r.NGN_USD)) {
    // ZAR per USD = (NGN per USD) / (NGN per ZAR)
    out.ZAR_USD = r.NGN_USD / r.NGN_ZAR;
  }
  if (!out.KES_USD && isFiniteNum(r.KES_NGN) && isFiniteNum(r.NGN_USD)) {
    // KES per USD = (KES per NGN) * (NGN per USD)
    out.KES_USD = r.KES_NGN * r.NGN_USD;
  }
  if (!out.GHS_USD && isFiniteNum(r.GHS_MAD) && isFiniteNum(r.MAD_USD)) {
    // GHS per USD = (GHS per MAD) * (MAD per USD)
    out.GHS_USD = r.GHS_MAD * r.MAD_USD;
  }
  return out;
}

export function convertCurrency(amount: number, from: string, to: string, fx?: FxPerUsd | null): number {
  if (!isFiniteNum(amount)) return 0;
  const f = (from || 'NGN').toUpperCase();
  const t = (to || 'NGN').toUpperCase();
  if (f === t) return amount;
  if (!fx) return amount; // no rates -> identity

  // Helper to get per-USD rate
  const perUSD = (cur: string): number | undefined => {
    switch (cur) {
      case 'USD': return 1;
      case 'NGN': return fx.NGN_USD;
      case 'KES': return fx.KES_USD;
      case 'ZAR': return fx.ZAR_USD;
      case 'GHS': return fx.GHS_USD;
      case 'MAD': return fx.MAD_USD;
      case 'CFA': return fx.CFA_USD;
      default: return undefined;
    }
  };

  const fromPerUSD = perUSD(f);
  const toPerUSD = perUSD(t);
  if (!fromPerUSD || !toPerUSD || fromPerUSD <= 0 || toPerUSD <= 0) {
    return amount; // insufficient rates
  }

  // Convert source -> USD, then USD -> target
  const usd = amount / fromPerUSD; // because fromPerUSD = units per USD
  const out = usd * toPerUSD;
  return out;
}

function isFiniteNum(n: any): n is number { return typeof n === 'number' && Number.isFinite(n); }

const FX_CACHE_KEY = 'consultflow:fx:last';
type FxCache = { at: number; fx: FxPerUsd };

export function saveFxCache(fx: FxPerUsd | null) {
  if (typeof window === 'undefined' || !fx) return;
  try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ at: Date.now(), fx } satisfies FxCache)); } catch {}
}

export function loadFxCache(): FxPerUsd | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache | FxPerUsd;
    if ('fx' in (parsed as any) && typeof (parsed as any).at === 'number') return (parsed as FxCache).fx;
    return parsed as FxPerUsd;
  } catch { return null; }
}

export function loadFxCacheMeta(): { fx: FxPerUsd; at: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache | FxPerUsd;
    if ('fx' in (parsed as any) && typeof (parsed as any).at === 'number') return parsed as FxCache;
    // Backward comp:
    return { fx: parsed as FxPerUsd, at: Date.now() };
  } catch { return null; }
}

export function loadFxCacheIfFresh(maxAgeMs: number): FxPerUsd | null {
  const meta = loadFxCacheMeta();
  if (!meta) return null;
  if (Date.now() - meta.at <= maxAgeMs) return meta.fx;
  return null;
}
