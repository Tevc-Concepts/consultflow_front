"use client";

import axios, { AxiosInstance, AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAppStore } from '@shared/state/app';
import { getReports, getForecast, getTaxSummary, getAI, listAdjustments, addAdjustment, deleteAdjustment } from '@shared/data/demoDb';
import { frappeApi } from './frappe';

/**
 * Returns a configured Axios instance whose baseURL depends on data source.
 * - Demo mode: use in-memory demo data with mock adapter
 * - LocalDb mode: use Next.js API routes ("/api/local/*") 
 * - Frappe mode: use Frappe API client with configured base URL
 */
export function getApi(): AxiosInstance {
    // Get data source from environment variable, fallback to store
    const envDataSource = process.env.NEXT_PUBLIC_DATA_SOURCE as 'demo' | 'localDb' | 'frappe';
    const { demoMode, dataSource: storeDataSource } = useAppStore.getState();
    
    // Priority: env var > store state > default to localDb
    const dataSource = envDataSource || storeDataSource || 'localDb';
    
    // Log current configuration if debug is enabled
    if (process.env.NEXT_PUBLIC_DEBUG_API === 'true') {
        console.log('API Configuration:', { 
            envDataSource, 
            storeDataSource, 
            finalDataSource: dataSource,
            localApiUrl: process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL,
            frappeApiUrl: process.env.NEXT_PUBLIC_FRAPPE_API_BASE_URL
        });
    }
    
    // When using 'frappe', return the Frappe API client
    if (dataSource === 'frappe') {
        return frappeApi.client;
    }
    
    // For localDb and demo modes, use Next.js API routes
    const baseURL = dataSource === 'localDb' 
        ? '' // Use empty base URL for relative paths to avoid duplication
        : '';
    const instance = axios.create({ baseURL, withCredentials: true });

    // Basic request interceptor (attach auth token if needed later)
    instance.interceptors.request.use((config) => {
        // Rewrite demo endpoints to live endpoints if not in demo mode
        if (config.url) {
            // Normalize URLs based on data source
            if (dataSource === 'localDb') {
                // Redirect demo endpoints to local API
                if (config.url.startsWith('/api/demo/')) {
                    config.url = config.url.replace('/api/demo/', '/api/local/');
                }
            }
        }
        // Attach common headers
        config.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            ...(config.headers || {})
        } as any;
        return config;
    });

    // In demo mode, short-circuit selected API calls to local DemoDB (no network)
    if (dataSource === 'demo') {
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

// Export Frappe-specific API methods
export const frappeAPI = {
    // Company management
    getCompanies: () => frappeApi.getCompanies(),
    getCompany: (name: string) => frappeApi.getCompany(name),
    
    // Financial data
    getChartOfAccounts: (company: string) => frappeApi.getChartOfAccounts(company),
    getGeneralLedger: (filters: any) => frappeApi.getGeneralLedger(filters),
    getFinancialStatements: (filters: any) => frappeApi.getFinancialStatements(filters),
    
    // Reports
    generateProfitLoss: (filters: any) => frappeApi.generateProfitLoss(filters),
    generateBalanceSheet: (filters: any) => frappeApi.generateBalanceSheet(filters),
    generateCashFlow: (filters: any) => frappeApi.generateCashFlow(filters),
    
    // File operations
    uploadFile: (file: File, doctype?: string, docname?: string) => 
        frappeApi.uploadFile(file, doctype, docname),
    
    // Generic operations
    getDoc: <T = any>(doctype: string, name: string) => frappeApi.getDoc<T>(doctype, name),
    getList: <T = any>(doctype: string, filters?: any, fields?: string[]) => 
        frappeApi.getList<T>(doctype, filters, fields),
    createDoc: <T = any>(doctype: string, data: any) => frappeApi.createDoc<T>(doctype, data),
    updateDoc: <T = any>(doctype: string, name: string, data: any) => 
        frappeApi.updateDoc<T>(doctype, name, data),
    deleteDoc: (doctype: string, name: string) => frappeApi.deleteDoc(doctype, name),
    call: <T = any>(method: string, args?: any) => frappeApi.call<T>(method, args),
};

export default getApi;
