// Lightweight per-company rate cache stub to complement existing global FX cache.
// Provides in-memory lookups for (companyId, base->target, date) with last-known fallback.
// This intentionally avoids network; caller can plug a fetcher later.

import { accountingRepository } from '@shared/repositories/accountingRepository';
import type { ExchangeRate, CurrencyCode } from '@entities/accounting/types';

interface RateKey { companyId: string; base: CurrencyCode; target: CurrencyCode; date: string; }
interface CachedRate { rate: number; date: string; source: 'exact' | 'last-known'; }

// In-memory map only (not persisted): companyId|base|target -> sorted array of {date, rate}
const memory = new Map<string, { date: string; rate: number }[]>();

function key(companyId: string, base: string, target: string) {
  return `${companyId}:${base}:${target}`;
}

// Seed memory from repository on first access
function ensure(companyId: string, base: CurrencyCode, target: CurrencyCode) {
  const k = key(companyId, base, target);
  if (!memory.has(k)) {
    const list = accountingRepository.listExchangeRates(companyId)
      .filter(r => r.base === base && r.target === target)
      .map(r => ({ date: r.date, rate: r.rate }))
      .sort((a,b) => a.date.localeCompare(b.date));
    memory.set(k, list);
  }
}

export function cacheRate(rate: ExchangeRate) {
  ensure(rate.id.split('-')[0], rate.base, rate.target); // crude companyId inference if id pattern maintained
  const k = key(rate.id.split('-')[0], rate.base, rate.target);
  const arr = memory.get(k)!;
  const idx = arr.findIndex(r => r.date === rate.date);
  if (idx >= 0) arr[idx].rate = rate.rate; else arr.push({ date: rate.date, rate: rate.rate });
  arr.sort((a,b) => a.date.localeCompare(b.date));
}

export function lookupRate(companyId: string, base: CurrencyCode, target: CurrencyCode, date: string): CachedRate | null {
  if (base === target) return { rate: 1, date, source: 'exact' };
  ensure(companyId, base, target);
  const k = key(companyId, base, target);
  const arr = memory.get(k)!;
  // exact?
  const exact = arr.find(r => r.date === date);
  if (exact) return { rate: exact.rate, date: exact.date, source: 'exact' };
  // last-known prior
  const prior = [...arr].filter(r => r.date < date).pop();
  if (prior) return { rate: prior.rate, date: prior.date, source: 'last-known' };
  return null;
}

// Placeholder that a future async fetcher could call and then populate cache
export async function fetchAndCacheRate(_companyId: string, _base: CurrencyCode, _target: CurrencyCode, _date: string): Promise<CachedRate | null> {
  // Intentionally a no-op stub for now (no external calls). Could integrate with a FX service later.
  return null;
}

export type { CachedRate };
