import * as React from 'react';
import getApi from '@shared/api/client';
import { normalizeRates, convertCurrency, loadFxCache, saveFxCache, type FxPerUsd } from '@shared/utils/fx';

export function useFxRates() {
  const [fx, setFx] = React.useState<FxPerUsd | null>(() => loadFxCache());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const api = getApi();
      const res = await api.get('/api/local/exchange-rates');
      const list = res.data?.rates || [];
      if (Array.isArray(list) && list.length) {
        const last = list[list.length - 1];
        const norm = normalizeRates(last);
        if (norm) {
          setFx(norm);
          saveFxCache(norm);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load FX');
    } finally {
      setLoading(false);
    }
  }, []);

  const convert = React.useCallback((amount: number, from: string, to: string) => {
    return convertCurrency(amount, from, to, fx || undefined);
  }, [fx]);

  // On mount, ensure we have fresh data (but keep cached immediately)
  React.useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  return { fx, loading, error, refresh, convert };
}
