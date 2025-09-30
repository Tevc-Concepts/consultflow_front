"use client";

import * as React from 'react';
import { useAppStore, type AppState } from '@shared/state/app';
import { loadFxCacheMeta } from '@shared/utils/fx';
import { useFxRates } from '@shared/hooks/useFx';

type Props = { className?: string; showCurrency?: boolean; showRefresh?: boolean };

export default function FxBadge({ className = '', showCurrency = true, showRefresh = false }: Props) {
  const reportingCurrency = useAppStore((s: AppState) => s.reportingCurrency);
  const [label, setLabel] = React.useState<string>('');
  const [currencies, setCurrencies] = React.useState<string>('');
  const { fx, refresh, loading } = useFxRates();

  const updateFromCache = React.useCallback(() => {
    const meta = loadFxCacheMeta();
    if (meta?.at) {
      const d = new Date(meta.at);
      const month = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      setLabel(`Last FX: ${month}`);
    } else {
      setLabel('FX: cached');
    }
    const map = meta?.fx || fx || {};
    const available: string[] = [];
    if (map) {
      // USD implicit (1). Add each currency with defined per-USD rate
      if (map.NGN_USD) available.push('NGN');
      if (map.KES_USD) available.push('KES');
      if (map.ZAR_USD) available.push('ZAR');
      if (map.GHS_USD) available.push('GHS');
      if (map.MAD_USD) available.push('MAD');
      if ((map as any).CFA_USD) available.push('CFA');
    }
    setCurrencies(['USD'].concat(available).join(', '));
  }, [fx]);

  React.useEffect(() => { updateFromCache(); }, [updateFromCache]);

  const onRefresh = async () => {
    try { await refresh(); } finally { updateFromCache(); }
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-lg border border-medium/50 bg-white/60 px-2 py-1 text-xs text-deep-navy/70',
        className
      ].join(' ')}
      title={`Exchange rates used. Currencies: ${currencies || 'USD'}`}
    >
      {showCurrency && (
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cobalt" aria-hidden />
          <span>Reporting: {reportingCurrency}</span>
        </span>
      )}
      <span className="ml-2 opacity-80">{label}</span>
      {showRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="ml-1 rounded-md border border-medium/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide hover:bg-medium/30 disabled:opacity-60"
          aria-label="Refresh exchange rates"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
    </span>
  );
}
