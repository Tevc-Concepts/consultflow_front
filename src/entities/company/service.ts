import { Company, CompanyGroup } from '@entities/company/types';
import { frappeAPI } from '@shared/api/client';

class CompanyService {
    private companies: Map<string, Company> = new Map();
    private groups: Map<string, CompanyGroup> = new Map();

    async getCompanies(forceRefresh = false): Promise<Company[]> {
        if (this.companies.size === 0 || forceRefresh) {
            await this.loadCompanies();
        }
        return Array.from(this.companies.values());
    }

    async getCompany(id: string): Promise<Company | null> {
        if (!this.companies.has(id)) {
            await this.loadCompanies();
        }
        return this.companies.get(id) || null;
    }

    async createCompany(data: Partial<Company>): Promise<Company> {
        const company = await frappeAPI.createDoc<Company>('Company', data);
        this.companies.set(company.id, company);
        return company;
    }

    async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
        const company = await frappeAPI.updateDoc<Company>('Company', id, data);
        this.companies.set(id, company);
        return company;
    }

    async deleteCompany(id: string): Promise<boolean> {
        try {
            await frappeAPI.deleteDoc('Company', id);
            this.companies.delete(id);
            return true;
        } catch (error) {
            console.error('Failed to delete company:', error);
            return false;
        }
    }

    async getCompanyGroups(): Promise<CompanyGroup[]> {
        if (this.groups.size === 0) {
            await this.loadGroups();
        }
        return Array.from(this.groups.values());
    }

    async createCompanyGroup(data: Omit<CompanyGroup, 'id' | 'created_at' | 'updated_at'>): Promise<CompanyGroup> {
        const group: CompanyGroup = {
            ...data,
            id: `group-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        
        // For now, store locally. In production, this would be saved to Frappe
        this.groups.set(group.id, group);
        return group;
    }

    async getConsolidatedFinancials(groupId: string, params: {
        period_start: string;
        period_end: string;
        currency?: 'NGN' | 'USD' | 'CFA';
    }) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error('Company group not found');
        }

        // Fetch financial data for each company in the group
        const financials = await Promise.all(
            group.company_ids.map(companyId =>
                frappeAPI.generateProfitLoss({
                    company: companyId,
                    from_date: params.period_start,
                    to_date: params.period_end,
                    presentation_currency: params.currency
                })
            )
        );

        // Consolidate the results
        return this.consolidateFinancials(financials, group.consolidation_rules);
    }

    async validateCompanyData(data: Partial<Company>): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        if (!data.name) errors.push('Company name is required');
        if (!data.registration_number) errors.push('Registration number is required');
        if (!data.tax_id) errors.push('Tax ID is required');
        if (!data.currency) errors.push('Currency is required');

        // Validate email format
        if (data.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) {
            errors.push('Invalid email format');
        }

        // Check for duplicate registration numbers
        if (data.registration_number) {
            const companies = await this.getCompanies();
            const duplicate = companies.find(c => 
                c.registration_number === data.registration_number && c.id !== data.id
            );
            if (duplicate) {
                errors.push('Registration number already exists');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private async loadCompanies(): Promise<void> {
        try {
            const companies = await frappeAPI.getCompanies();
            companies.forEach(company => {
                // Convert Frappe company format to our Company interface
                const mappedCompany: Company = {
                    id: company.name,
                    name: company.company_name,
                    legal_name: company.company_name,
                    registration_number: company.registration_details || '',
                    tax_id: company.tax_id || '',
                    currency: company.default_currency as 'NGN' | 'USD' | 'CFA',
                    fiscal_year_end: '12-31', // Default
                    industry: '',
                    country: company.country,
                    address: {
                        street: '',
                        city: '',
                        state: '',
                        postal_code: '',
                        country: company.country
                    },
                    contact: {
                        phone: '',
                        email: '',
                        primary_contact: ''
                    },
                    settings: {
                        consolidation_enabled: false,
                        multi_currency_enabled: false,
                        auto_fx_rates: true,
                        reporting_currency: company.default_currency as 'NGN' | 'USD' | 'CFA',
                        decimal_places: 2,
                        date_format: 'DD/MM/YYYY'
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_active: true
                };
                this.companies.set(mappedCompany.id, mappedCompany);
            });
        } catch (error) {
            console.error('Failed to load companies:', error);
        }
    }

    private async loadGroups(): Promise<void> {
        // In production, this would load from Frappe
        // For now, create a demo group
        const demoGroup: CompanyGroup = {
            id: 'demo-group-1',
            name: 'Demo Group',
            description: 'Consolidated view of all demo companies',
            company_ids: ['lagos-ng', 'nairobi-ke', 'cape-town-za'],
            consolidation_rules: [
                {
                    id: 'rule-1',
                    name: 'Intercompany Elimination',
                    type: 'elimination',
                    source_account: 'Intercompany Receivable',
                    target_account: 'Intercompany Payable',
                    factor: -1,
                    conditions: {}
                }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.groups.set(demoGroup.id, demoGroup);
    }

    private consolidateFinancials(financials: any[], rules: any[]): any {
        // Simplified consolidation logic
        // In production, this would be much more sophisticated
        const consolidated = {
            revenue: 0,
            expenses: 0,
            net_income: 0,
            total_assets: 0,
            total_liabilities: 0,
            total_equity: 0
        };

        financials.forEach(financial => {
            // Sum up financial statements
            if (financial.revenue) consolidated.revenue += financial.revenue;
            if (financial.expenses) consolidated.expenses += financial.expenses;
            if (financial.net_income) consolidated.net_income += financial.net_income;
        });

        // Apply consolidation rules
        rules.forEach(rule => {
            // Apply elimination entries, adjustments, etc.
            // This is a placeholder for complex consolidation logic
        });

        return consolidated;
    }
}

export const companyService = new CompanyService();
export default CompanyService;