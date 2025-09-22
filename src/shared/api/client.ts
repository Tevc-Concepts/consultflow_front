"use client";

import axios, { AxiosInstance, AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAppStore } from '@shared/state/app';
import { getReports, getForecast, getTaxSummary, getAI, listAdjustments, addAdjustment, deleteAdjustment } from '@shared/data/demoDb';

/**
 * Returns a configured Axios instance whose baseURL depends on Demo mode.
 * - Demo mode: use relative Next.js API routes ("/api/demo/*").
 * - Live mode: use NEXT_PUBLIC_API_BASE_URL if provided.
 */
export function getApi(): AxiosInstance {
    const { demoMode } = useAppStore.getState();
    const baseURL = demoMode ? '' : (process.env.NEXT_PUBLIC_API_BASE_URL || '');
    const instance = axios.create({ baseURL, withCredentials: true });

    // Basic request interceptor (attach auth token if needed later)
    instance.interceptors.request.use((config) => {
        // Rewrite demo endpoints to live endpoints if not in demo mode
        if (!demoMode && config.url) {
            // If callers still send "/api/demo/...", rewrite to "/api/..." for live base
            if (config.url.startsWith('/api/demo/')) {
                config.url = config.url.replace('/api/demo/', '/api/');
            }
        }
        // Attach common headers
        config.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            ...(config.headers || {})
        } as any;
        // TODO: attach auth token/cookies when wiring real auth
        return config;
    });
    // In demo mode, short-circuit selected API calls to local DemoDB (no network)
    if (demoMode) {
        const orig: AxiosAdapter | undefined = instance.defaults.adapter as any;
        const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
            const url = (config.url || '').toString();
            const method = (config.method || 'get').toLowerCase();
            const build = (data: any): AxiosResponse => ({ data, status: 200, statusText: 'OK', headers: {}, config, request: {} as any });
            try {
                if (url.startsWith('/api/demo/reports') && method === 'get') {
                    const p = (config.params || {}) as any;
                    const data = getReports({ company: p.company, currency: p.currency, range: p.range, from: p.from, to: p.to });
                    return Promise.resolve(build(data));
                }
                // Adjustments CRUD
                if (url.startsWith('/api/demo/reports/adjustments')) {
                    const p = (config.params || {}) as any;
                    if (method === 'get') {
                        const companies = (p?.companies ? String(p.companies).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined);
                        const data = { items: listAdjustments(companies) };
                        return Promise.resolve(build(data));
                    }
                    if (method === 'post') {
                        let body: any = {};
                        try { body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {}); } catch { body = {}; }
                        const item = addAdjustment(body);
                        return Promise.resolve(build({ ok: true, item }));
                    }
                    if (method === 'delete') {
                        const id = (p?.id ?? '').toString();
                        const ok = id ? deleteAdjustment(id) : false;
                        return Promise.resolve(build({ ok }));
                    }
                }
                if (url.startsWith('/api/demo/forecast') && method === 'get') {
                    const p = (config.params || {}) as any;
                    const months = Number(p.months ?? 12);
                    const data = getForecast(months);
                    return Promise.resolve(build(data));
                }
                if (url.startsWith('/api/demo/tax-summary') && method === 'get') {
                    const data = getTaxSummary();
                    return Promise.resolve(build(data));
                }
                if (url.startsWith('/api/demo/ai') && method === 'post') {
                    let body: any = {};
                    try { body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {}); } catch { body = {}; }
                    const prompt = body.prompt ?? body.question ?? '';
                    const data = getAI(prompt);
                    return Promise.resolve(build(data));
                }
            } catch (e) {
                // fall through to original adapter on any unexpected error
            }
            // Otherwise delegate to original adapter (XHR)
            if (orig) return orig(config as any);
            // Should not happen in browser, but return a minimal response
            return Promise.resolve(build({}));
        };
        instance.defaults.adapter = demoAdapter;
    }
    return instance;
}

export default getApi;
