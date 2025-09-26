export interface Company {
    id: string;
    name: string;
    legal_name: string;
    registration_number: string;
    tax_id: string;
    currency: 'NGN' | 'USD' | 'CFA';
    fiscal_year_end: string; // MM-DD format
    industry: string;
    country: string;
    address: CompanyAddress;
    contact: CompanyContact;
    settings: CompanySettings;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface CompanyAddress {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

export interface CompanyContact {
    phone: string;
    email: string;
    website?: string;
    primary_contact: string;
}

export interface CompanySettings {
    consolidation_enabled: boolean;
    multi_currency_enabled: boolean;
    auto_fx_rates: boolean;
    reporting_currency: 'NGN' | 'USD' | 'CFA';
    decimal_places: number;
    date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

export interface CompanyGroup {
    id: string;
    name: string;
    description?: string;
    company_ids: string[];
    consolidation_rules: ConsolidationRule[];
    created_at: string;
    updated_at: string;
}

export interface ConsolidationRule {
    id: string;
    name: string;
    type: 'elimination' | 'adjustment' | 'mapping';
    source_account: string;
    target_account: string;
    factor: number;
    conditions: Record<string, any>;
}