import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { authService } from '@features/auth/service';

export interface FrappeAPIConfig {
    baseUrl: string;
    version?: string;
}

export interface FrappeResponse<T = any> {
    data?: T;
    message?: string;
    docs?: T[];
    doc?: T;
    exc_type?: string;
    exc?: string;
    _server_messages?: string;
    _error_messages?: string[];
}

export interface FrappeListResponse<T = any> {
    data: T[];
    total_count: number;
    page_length: number;
    start: number;
}

export interface FrappeAuthResponse {
    user: string;
    email: string;
    full_name: string;
    roles: string[];
    message: string;
    home_page: string;
}

export interface FrappeDocResponse<T = any> {
    docs: T[];
}

class FrappeAPI {
    public client: AxiosInstance;
    private config: FrappeAPIConfig;

    constructor(config?: Partial<FrappeAPIConfig>) {
        this.config = {
            baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
            version: 'v2',
            ...config,
        };

        this.client = axios.create({
            baseURL: `${this.config.baseUrl}/api/resource/`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            withCredentials: true,
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const sessionId = authService.getSessionId();
                if (sessionId) {
                    config.headers['Authorization'] = `token ${sessionId}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse<FrappeResponse>) => {
                // Handle Frappe-specific error responses
                if (response.data.exc_type || response.data.exc) {
                    const error = new Error(response.data.exc || 'Frappe API Error');
                    error.name = response.data.exc_type || 'FrappeError';
                    throw error;
                }

                return response;
            },
            async (error) => {
                // Handle 401 unauthorized
                if (error.response?.status === 401) {
                    // Try to refresh session
                    const refreshed = await authService.refreshSession();
                    if (!refreshed) {
                        // Redirect to login if refresh fails
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Authentication endpoints
    async login(email: string, password: string): Promise<FrappeAuthResponse> {
        const response = await axios.post(
            `${this.config.baseUrl}/api/method/login`,
            { usr: email, pwd: password },
            { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        );

        return response.data;
    }

    async logout(): Promise<void> {
        await axios.post(
            `${this.config.baseUrl}/api/method/logout`,
            {},
            { withCredentials: true }
        );
    }

    // Generic CRUD operations
    async getList<T = any>(
        doctype: string,
        filters?: Record<string, any>,
        fields?: string[],
        orderBy?: string,
        limit?: number,
        start?: number
    ): Promise<FrappeListResponse<T>> {
        const params: any = {};
        
        if (filters) params.filters = JSON.stringify(filters);
        if (fields) params.fields = JSON.stringify(fields);
        if (orderBy) params.order_by = orderBy;
        if (limit) params.limit_page_length = limit;
        if (start) params.limit_start = start;

        const response = await this.client.get<FrappeResponse<T[]>>(doctype, { params });
        
        return {
            data: response.data.data || [],
            total_count: 0, // Frappe doesn't always return this
            page_length: limit || 20,
            start: start || 0,
        };
    }

    async getDoc<T = any>(doctype: string, name: string): Promise<T> {
        const response = await this.client.get<FrappeResponse<T>>(`${doctype}/${name}`);
        return response.data.data || response.data.doc!;
    }

    async createDoc<T = any>(doctype: string, data: Partial<T>): Promise<T> {
        const response = await this.client.post<FrappeResponse<T>>(doctype, data);
        return response.data.data || response.data.doc!;
    }

    async updateDoc<T = any>(doctype: string, name: string, data: Partial<T>): Promise<T> {
        const response = await this.client.put<FrappeResponse<T>>(`${doctype}/${name}`, data);
        return response.data.data || response.data.doc!;
    }

    async deleteDoc(doctype: string, name: string): Promise<void> {
        await this.client.delete(`${doctype}/${name}`);
    }

    // Custom method calls
    async call<T = any>(
        method: string,
        args?: Record<string, any>,
        httpMethod: 'GET' | 'POST' = 'POST'
    ): Promise<T> {
        const url = `${this.config.baseUrl}/api/method/${method}`;
        
        if (httpMethod === 'GET') {
            const response = await axios.get<FrappeResponse<T>>(url, { 
                params: args,
                withCredentials: true 
            });
            return (response.data.message || response.data.data) as T;
        } else {
            const response = await axios.post<FrappeResponse<T>>(url, args, { 
                withCredentials: true 
            });
            return (response.data.message || response.data.data) as T;
        }
    }

    // File upload
    async uploadFile(file: File, doctype?: string, docname?: string): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        if (doctype) formData.append('doctype', doctype);
        if (docname) formData.append('docname', docname);

        const response = await axios.post(
            `${this.config.baseUrl}/api/method/upload_file`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            }
        );

        return response.data.message;
    }

    // Business-specific endpoints
    
    // Company management
    async getCompanies(): Promise<any[]> {
        return this.getList('Company', 
            { disabled: 0 }, 
            ['name', 'company_name', 'default_currency', 'country']
        ).then(r => r.data);
    }

    async getCompany(name: string): Promise<any> {
        return this.getDoc('Company', name);
    }

    // Financial data
    async getChartOfAccounts(company: string): Promise<any[]> {
        return this.getList('Account', 
            { company, disabled: 0 },
            ['name', 'account_name', 'account_type', 'parent_account', 'is_group']
        ).then(r => r.data);
    }

    async getGeneralLedger(filters: {
        company: string;
        from_date: string;
        to_date: string;
        account?: string;
    }): Promise<any[]> {
        return this.call('erpnext.accounts.utils.get_gl_entries', filters);
    }

    async getFinancialStatements(filters: {
        company: string;
        from_date: string;
        to_date: string;
        periodicity: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
    }): Promise<any> {
        return this.call('erpnext.accounts.utils.get_financial_statements', filters);
    }

    // Reports
    async generateProfitLoss(filters: {
        company: string;
        from_date: string;
        to_date: string;
        periodicity?: string;
        presentation_currency?: string;
    }): Promise<any> {
        return this.call('erpnext.accounts.report.profit_and_loss_statement.profit_and_loss_statement.execute', filters);
    }

    async generateBalanceSheet(filters: {
        company: string;
        to_date: string;
        periodicity?: string;
        presentation_currency?: string;
    }): Promise<any> {
        return this.call('erpnext.accounts.report.balance_sheet.balance_sheet.execute', filters);
    }

    async generateCashFlow(filters: {
        company: string;
        from_date: string;
        to_date: string;
        presentation_currency?: string;
    }): Promise<any> {
        return this.call('erpnext.accounts.report.cash_flow.cash_flow.execute', filters);
    }

    // Tax and compliance
    async getTaxTemplates(): Promise<any[]> {
        return this.getList('Sales Taxes and Charges Template', 
            { disabled: 0 },
            ['name', 'title', 'company']
        ).then(r => r.data);
    }

    // Integration helpers
    async testConnection(): Promise<boolean> {
        try {
            await this.call('ping');
            return true;
        } catch {
            return false;
        }
    }
}

export const frappeApi = new FrappeAPI();
export default FrappeAPI;