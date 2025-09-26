// Server-only SQLite helper (used by Next.js API routes under /api/local/*)
// Note: This runs on the Next server runtime. It should not be imported into client components.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: any | null = null;

function getDB() {
    if (db) return db;
    const filepath = process.env.LOCAL_SQLITE_PATH || path.join(process.cwd(), '.data', 'consultflow.db');
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new (Database as any)(filepath);
    bootstrap(db);
    return db;
}

function bootstrap(d: any) {
    d.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
            currency TEXT NOT NULL,
            country TEXT,
            sector TEXT,
            established INTEGER,
            is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
            company_id TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );
    CREATE TABLE IF NOT EXISTS series (
      company_id TEXT NOT NULL,
      date TEXT NOT NULL,
      revenue INTEGER NOT NULL,
      cogs INTEGER NOT NULL,
      expenses INTEGER NOT NULL,
            cash INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY(company_id, date)
    );
    CREATE TABLE IF NOT EXISTS adjustments (
      id TEXT PRIMARY KEY,
      companies TEXT NOT NULL, -- comma-separated company ids
      date TEXT NOT NULL,
      field TEXT NOT NULL, -- 'revenue' | 'cogs' | 'expenses'
      delta INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS general_ledger (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      posting_date TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_code TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      reference TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );
    CREATE TABLE IF NOT EXISTS exchange_rates (
      month TEXT PRIMARY KEY,
      ngn_usd REAL,
      kes_usd REAL,
      zar_usd REAL,
      ghs_usd REAL,
      mad_usd REAL,
      ngn_zar REAL,
      kes_ngn REAL,
      ghs_mad REAL
    );
        CREATE TABLE IF NOT EXISTS insights (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            title TEXT NOT NULL,
            detail TEXT NOT NULL,
            severity TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        );
  `);

    // Best-effort migrate existing DBs to include new columns
    try { d.exec(`ALTER TABLE companies ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch { }
    try { d.exec(`ALTER TABLE companies ADD COLUMN country TEXT`); } catch { }
    try { d.exec(`ALTER TABLE companies ADD COLUMN sector TEXT`); } catch { }
    try { d.exec(`ALTER TABLE companies ADD COLUMN established INTEGER`); } catch { }
    try { d.exec(`ALTER TABLE entities ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch { }
    try { d.exec(`ALTER TABLE series ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN kes_usd REAL`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN zar_usd REAL`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN ghs_usd REAL`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN mad_usd REAL`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN ngn_zar REAL`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN kes_ngn REAL`); } catch { }
    try { d.exec(`ALTER TABLE exchange_rates ADD COLUMN ghs_mad REAL`); } catch { }
    try { d.exec(`CREATE TABLE IF NOT EXISTS general_ledger (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      posting_date TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_code TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      reference TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    )`); } catch { }
}

export function query(sql: string, params?: any[]) {
    const d = getDB();
    const stmt = d.prepare(sql);
    return stmt.all(params || []);
}

export function run(sql: string, params?: any[]) {
    const d = getDB();
    const stmt = d.prepare(sql);
    return stmt.run(params || []);
}

export function get(sql: string, params?: any[]) {
    const d = getDB();
    const stmt = d.prepare(sql);
    return stmt.get(params || []);
}

export function transactional<T>(fn: () => T): T {
    const d = getDB();
    const tx = d.transaction(fn);
    return tx();
}

export function seedIfEmpty() {
    const c = get('SELECT COUNT(1) as n FROM companies') as any;
    if (c && c.n > 0) return;
    seedDatabase();
}

export function forceSeed() {
    // Clear all data first
    run('DELETE FROM general_ledger');
    run('DELETE FROM adjustments');  
    run('DELETE FROM insights');
    run('DELETE FROM series');
    run('DELETE FROM companies');
    run('DELETE FROM exchange_rates');
    
    // Re-seed with fresh data
    seedDatabase();
}

function seedDatabase() {
    
    // Create comprehensive dummy data for 5 companies across Africa
    const companies = [
        { id: 'lagos-ng', name: 'TechFlow Nigeria Ltd', currency: 'NGN', country: 'Nigeria', sector: 'Technology', established: 2018 },
        { id: 'nairobi-ke', name: 'East Africa Logistics Co', currency: 'KES', country: 'Kenya', sector: 'Logistics', established: 2016 },
        { id: 'cape-town-za', name: 'Southern Mining Corp', currency: 'ZAR', country: 'South Africa', sector: 'Mining', established: 2015 },
        { id: 'accra-gh', name: 'Ghana AgriTech Solutions', currency: 'GHS', country: 'Ghana', sector: 'Agriculture', established: 2020 },
        { id: 'casablanca-ma', name: 'Maghreb Trading SARL', currency: 'MAD', country: 'Morocco', sector: 'Trading', established: 2017 },
    ];
    
    // Account structure for realistic financial data
    const accounts = [
        { code: '1000', name: 'Cash and Bank', type: 'Asset' },
        { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
        { code: '1200', name: 'Inventory', type: 'Asset' },
        { code: '1500', name: 'Property, Plant & Equipment', type: 'Asset' },
        { code: '2000', name: 'Accounts Payable', type: 'Liability' },
        { code: '2100', name: 'Short-term Debt', type: 'Liability' },
        { code: '2500', name: 'Long-term Debt', type: 'Liability' },
        { code: '3000', name: 'Share Capital', type: 'Equity' },
        { code: '3100', name: 'Retained Earnings', type: 'Equity' },
        { code: '4000', name: 'Revenue', type: 'Income' },
        { code: '4100', name: 'Other Income', type: 'Income' },
        { code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
        { code: '6000', name: 'Salaries and Benefits', type: 'Expense' },
        { code: '6100', name: 'Rent and Utilities', type: 'Expense' },
        { code: '6200', name: 'Marketing and Advertising', type: 'Expense' },
        { code: '6300', name: 'Professional Services', type: 'Expense' },
        { code: '6400', name: 'Office Expenses', type: 'Expense' },
    ];
    
    transactional(() => {
        // Insert companies with full profile data
        for (const comp of companies) {
            run('INSERT OR REPLACE INTO companies (id, name, currency, country, sector, established, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', 
                [comp.id, comp.name, comp.currency, comp.country, comp.sector, comp.established]);
        }
        
        // Generate 24 months of series data for each company
        const now = new Date();
        const dates: string[] = [];
        for (let i = 23; i >= 0; i--) { 
            const d = new Date(now); 
            d.setMonth(d.getMonth() - i); 
            const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10); 
            dates.push(iso); 
        }
        
        // Generate data for each company with realistic business profiles
        companies.forEach((company, companyIndex) => {
            // Realistic starting values based on company profile and currency
            let cash: number;
            let baseRevenue: number;
            let profitMargin: number;
            
            switch(company.id) {
                case 'lagos-ng': // Tech company - high margins, good cash
                    cash = 45_000_000; // 45M NGN (~$45k USD)
                    baseRevenue = 25_000_000; // 25M NGN monthly
                    profitMargin = 0.25;
                    break;
                case 'nairobi-ke': // Logistics - medium margins, stable revenue
                    cash = 2_800_000; // 2.8M KES (~$21k USD)  
                    baseRevenue = 8_500_000; // 8.5M KES monthly
                    profitMargin = 0.18;
                    break;
                case 'cape-town-za': // Mining - variable margins, high volumes
                    cash = 850_000; // 850K ZAR (~$45k USD)
                    baseRevenue = 3_200_000; // 3.2M ZAR monthly
                    profitMargin = 0.22;
                    break;
                case 'accra-gh': // AgriTech - seasonal, growing
                    cash = 320_000; // 320K GHS (~$21k USD)
                    baseRevenue = 180_000; // 180K GHS monthly
                    profitMargin = 0.15;
                    break;
                case 'casablanca-ma': // Trading - tight margins, high volume
                    cash = 480_000; // 480K MAD (~$47k USD)
                    baseRevenue = 950_000; // 950K MAD monthly
                    profitMargin = 0.12;
                    break;
                default:
                    cash = 1_000_000;
                    baseRevenue = 1_000_000;
                    profitMargin = 0.15;
            }
            
            dates.forEach((date, i) => {
                const month = new Date(date).getMonth();
                const seasonal = [0.95, 0.92, 0.98, 1.02, 1.05, 1.07, 1.1, 1.12, 1.15, 1.25, 1.35, 1.5][month];
                const growth = 1 + i * 0.015; // 1.5% monthly growth
                const inflation = i > 6 ? 1.02 : 1;
                const sectorVariation = 1 + (Math.sin(companyIndex + i) * 0.08); // Industry cycles
                const currencyVolatility = 1 + (Math.sin(i * 0.5 + companyIndex) * 0.05); // FX impact
                
                // Apply sector-specific seasonality
                let sectorSeasonal = 1;
                if (company.sector === 'Agriculture') sectorSeasonal = seasonal * 1.2; // High seasonality
                else if (company.sector === 'Mining') sectorSeasonal = 1 + (Math.sin(i * 0.3) * 0.15); // Commodity cycles
                else if (company.sector === 'Technology') sectorSeasonal = growth * 1.1; // Steady growth
                else if (company.sector === 'Logistics') sectorSeasonal = seasonal * 0.8; // Moderate seasonality
                else sectorSeasonal = seasonal;
                
                let revenue = Math.round(baseRevenue * sectorSeasonal * growth * inflation * sectorVariation * currencyVolatility);
                const cogs = Math.round(revenue * (1 - profitMargin) * 0.6); // COGS as % of revenue
                const expenses = Math.round(revenue * (1 - profitMargin) * 0.4); // OpEx as % of revenue
                const netCashFlow = revenue - cogs - expenses;
                cash += netCashFlow;
                
                // Insert series data
                run('INSERT OR REPLACE INTO series (company_id, date, revenue, cogs, expenses, cash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', 
                    [company.id, date, revenue, cogs, expenses, cash]);
                
                // Generate general ledger entries for this month with realistic amounts
                const glEntries = [
                    // Revenue entries
                    { account_code: '4000', account_name: 'Revenue', debit: 0, credit: revenue },
                    { account_code: '1100', account_name: 'Accounts Receivable', debit: revenue * 0.6, credit: 0 }, // 60% on credit
                    { account_code: '1000', account_name: 'Cash and Bank', debit: revenue * 0.4, credit: 0 }, // 40% cash
                    
                    // COGS entries
                    { account_code: '5000', account_name: 'Cost of Goods Sold', debit: cogs, credit: 0 },
                    { account_code: '1200', account_name: 'Inventory', debit: 0, credit: cogs * 0.8 }, // Most from inventory
                    { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: cogs * 0.2 }, // Some on credit
                    
                    // Operating expense entries with realistic distribution
                    { account_code: '6000', account_name: 'Salaries and Benefits', debit: expenses * 0.45, credit: 0 },
                    { account_code: '6100', account_name: 'Rent and Utilities', debit: expenses * 0.15, credit: 0 },
                    { account_code: '6200', account_name: 'Marketing and Advertising', debit: expenses * 0.12, credit: 0 },
                    { account_code: '6300', account_name: 'Professional Services', debit: expenses * 0.08, credit: 0 },
                    { account_code: '6400', account_name: 'Office Expenses', debit: expenses * 0.2, credit: 0 },
                    { account_code: '1000', account_name: 'Cash and Bank', debit: 0, credit: expenses * 0.85 }, // 85% paid in cash
                    { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: expenses * 0.15 }, // 15% on credit
                ];
                
                glEntries.forEach((entry, entryIndex) => {
                    const glId = `${company.id}-${date}-${entry.account_code}-${entryIndex}`;
                    run('INSERT OR REPLACE INTO general_ledger (id, company_id, posting_date, account_name, account_code, debit, credit, reference, description, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
                        [glId, company.id, date, entry.account_name, entry.account_code, entry.debit, entry.credit, `JE-${date}`, `Monthly ${entry.account_name} entry`, new Date().toISOString()]);
                });
                
                // Add balance sheet entries for end of month (only on last day of quarter for clean data)
                if (i % 3 === 2) { // Every 3rd month (quarterly balance sheet)
                    const bsEntries = [
                        // Assets - realistic values based on business size and currency
                        { account_code: '1000', account_name: 'Cash and Bank', debit: Math.max(cash, 0), credit: 0 },
                        { account_code: '1100', account_name: 'Accounts Receivable', debit: revenue * 2.5, credit: 0 }, // 2.5 months of sales
                        { account_code: '1200', account_name: 'Inventory', debit: revenue * 0.8, credit: 0 }, // Inventory turnover
                        { account_code: '1500', account_name: 'Property, Plant & Equipment', debit: baseRevenue * 6, credit: 0 }, // Fixed assets
                        
                        // Liabilities
                        { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: expenses * 1.5 }, // 1.5 months of expenses
                        { account_code: '2100', account_name: 'Short-term Debt', debit: 0, credit: baseRevenue * 1.2 }, // Working capital debt
                        { account_code: '2500', account_name: 'Long-term Debt', debit: 0, credit: baseRevenue * 3 }, // Term loans
                        
                        // Equity - balancing figure
                        { account_code: '3000', account_name: 'Share Capital', debit: 0, credit: baseRevenue * 2 },
                        { account_code: '3100', account_name: 'Retained Earnings', debit: 0, credit: (revenue - cogs - expenses) * i * 0.8 }, // Accumulated earnings
                    ];
                    
                    bsEntries.forEach((entry, entryIndex) => {
                        const bsId = `${company.id}-${date}-BS-${entry.account_code}-${entryIndex}`;
                        run('INSERT OR REPLACE INTO general_ledger (id, company_id, posting_date, account_name, account_code, debit, credit, reference, description, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
                            [bsId, company.id, date, entry.account_name, entry.account_code, entry.debit, entry.credit, `BS-${date}`, `Quarterly ${entry.account_name} balance`, new Date().toISOString()]);
                    });
                }
            });
            
            // Generate some sample adjustments
            for (let adj = 0; adj < 3; adj++) {
                const adjustmentDate = dates[Math.floor(Math.random() * dates.length)];
                const fields = ['revenue', 'cogs', 'expenses'] as const;
                const field = fields[adj];
                const delta = (Math.random() - 0.5) * 1000000; // Random adjustment between -500k and +500k
                
                const adjId = `${Date.now()}-${company.id}-${adj}-${Math.random().toString(36).slice(2, 8)}`;
                run('INSERT INTO adjustments (id, companies, date, field, delta, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                    adjId,
                    company.id,
                    adjustmentDate,
                    field,
                    Math.round(delta),
                    `Sample ${field} adjustment for ${company.name}`,
                    new Date().toISOString()
                ]);
            }
            
            // Generate company-specific insights with realistic business context
            const insights = [
                { 
                    title: `${company.sector} Sector Performance`, 
                    detail: `${company.name} shows strong performance in the ${company.sector} sector with consistent growth patterns and healthy margins of ${(profitMargin * 100).toFixed(1)}%`, 
                    severity: 'low' as const
                },
                { 
                    title: 'Cash Flow Management', 
                    detail: `Monitor ${company.currency} cash flows for ${company.name} - current balance of ${Math.round(cash/1000)}K shows ${cash > 0 ? 'healthy liquidity' : 'potential cash flow challenges'}`, 
                    severity: cash > 500000 ? 'low' as const : 'medium' as const
                },
                { 
                    title: 'Currency Risk Exposure', 
                    detail: `${company.name} operates in ${company.currency} with potential FX exposure. Consider hedging strategies for cross-border operations`, 
                    severity: 'medium' as const
                },
                { 
                    title: 'Market Position Analysis', 
                    detail: `As a ${company.sector} company established in ${company.established}, ${company.name} has built solid market presence in ${company.country}`, 
                    severity: 'low' as const
                }
            ];
            
            insights.forEach((insight, idx) => {
                const insightId = `${company.id}-insight-${idx}-${Date.now()}`;
                run('INSERT INTO insights (id, company_id, title, detail, severity, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    [insightId, company.id, insight.title, insight.detail, insight.severity, new Date().toISOString()]);
            });
        });
        
        // Add comprehensive exchange rates for African currencies (base: USD)
        const currentDate = new Date();
        const exchangeRates = [];
        
        // Generate 24 months of exchange rates
        for (let i = 23; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().slice(0, 7); // YYYY-MM format
            
            // Base rates with realistic fluctuations (rates to USD)
            const volatility = Math.sin(i * 0.3) * 0.05; // 5% volatility
            const trend = i * 0.002; // Gradual depreciation trend
            
            exchangeRates.push({
                month: month,
                ngn_usd: 950.0 * (1 + volatility + trend), // Nigerian Naira
                kes_usd: 135.0 * (1 + volatility * 0.8 + trend), // Kenyan Shilling  
                zar_usd: 18.5 * (1 + volatility * 1.2 + trend), // South African Rand
                ghs_usd: 15.2 * (1 + volatility * 0.9 + trend), // Ghanaian Cedi
                mad_usd: 10.1 * (1 + volatility * 0.6 + trend), // Moroccan Dirham
                // Cross rates for consolidation
                ngn_zar: (950.0 / 18.5) * (1 + volatility * 0.5),
                kes_ngn: (135.0 / 950.0) * (1 + volatility * 0.3),
                ghs_mad: (15.2 / 10.1) * (1 + volatility * 0.4)
            });
        }
        
        exchangeRates.forEach(rate => {
            run('INSERT OR REPLACE INTO exchange_rates (month, ngn_usd, kes_usd, zar_usd, ghs_usd, mad_usd, ngn_zar, kes_ngn, ghs_mad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [rate.month, rate.ngn_usd, rate.kes_usd, rate.zar_usd, rate.ghs_usd, rate.mad_usd, rate.ngn_zar, rate.kes_ngn, rate.ghs_mad]);
        });
    });
}

export type LocalAdjustmentInput = { companies: string[]; date: string; field: 'revenue' | 'cogs' | 'expenses'; delta: number; note?: string };

export function insertAdjustment(a: LocalAdjustmentInput) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    run('INSERT INTO adjustments (id, companies, date, field, delta, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        id,
        a.companies.join(','),
        a.date,
        a.field,
        a.delta,
        a.note || null,
        new Date().toISOString()
    ]);
    return { id, ...a };
}

export function listAdjustmentsLocal(filterCompanies?: string[]) {
    const rows = query('SELECT * FROM adjustments ORDER BY created_at DESC') as any[];
    if (!filterCompanies || filterCompanies.length === 0) return rows;
    const set = new Set(filterCompanies);
    return rows.filter(r => String(r.companies).split(',').some((c: string) => set.has(c)));
}

export function deleteAdjustmentLocal(id: string) {
    const res = run('DELETE FROM adjustments WHERE id = ?', [id]);
    return res.changes > 0;
}

// Companies CRUD helpers
export type LocalCompany = { id: string; name: string; currency: string; is_active?: number };
export function listCompanies(activeOnly = true): LocalCompany[] {
    return query(`SELECT id, name, currency, is_active FROM companies ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY name ASC`) as any;
}
export function upsertCompany(c: LocalCompany) {
    run('INSERT INTO companies (id, name, currency, is_active) VALUES (?, ?, ?, COALESCE(?,1)) ON CONFLICT(id) DO UPDATE SET name=excluded.name, currency=excluded.currency, is_active=excluded.is_active', [c.id, c.name, c.currency, c.is_active ?? 1]);
    return c;
}
export function updateCompany(id: string, patch: Partial<LocalCompany>) {
    const cur = get('SELECT id, name, currency, is_active FROM companies WHERE id = ?', [id]) as any;
    if (!cur) return null;
    const next = { ...cur, ...patch } as LocalCompany;
    upsertCompany(next);
    return next;
}
export function deactivateCompany(id: string) {
    const res = run('UPDATE companies SET is_active = 0 WHERE id = ?', [id]);
    return res.changes > 0;
}

// Series helpers (for uploads)
export type LocalSeriesRow = { company_id: string; date: string; revenue: number; cogs: number; expenses: number; cash: number; is_active?: number };
export function upsertSeriesRows(rows: LocalSeriesRow[]) {
    transactional(() => {
        for (const r of rows) {
            run('INSERT INTO series (company_id, date, revenue, cogs, expenses, cash, is_active) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?,1)) ON CONFLICT(company_id, date) DO UPDATE SET revenue=excluded.revenue, cogs=excluded.cogs, expenses=excluded.expenses, cash=excluded.cash, is_active=excluded.is_active', [r.company_id, r.date, r.revenue, r.cogs, r.expenses, r.cash, r.is_active ?? 1]);
        }
    });
}

// Insights helpers
export type LocalInsight = { id: string; company_id?: string | null; title: string; detail: string; severity: 'low' | 'medium' | 'high'; created_at: string; is_active?: number };
export function listInsights(companyIds?: string[], limit = 10): LocalInsight[] {
    if (companyIds && companyIds.length > 0) {
        const placeholders = companyIds.map(() => '?').join(',');
        return query(`SELECT id, company_id, title, detail, severity, created_at, is_active FROM insights WHERE is_active = 1 AND (company_id IS NULL OR company_id IN (${placeholders})) ORDER BY datetime(created_at) DESC LIMIT ?`, [...companyIds, limit]) as any;
    }
    return query(`SELECT id, company_id, title, detail, severity, created_at, is_active FROM insights WHERE is_active = 1 ORDER BY datetime(created_at) DESC LIMIT ?`, [limit]) as any;
}
export function upsertInsight(i: Omit<LocalInsight, 'created_at' | 'id'> & { id?: string }) {
    const id = i.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const created_at = new Date().toISOString();
    run('INSERT INTO insights (id, company_id, title, detail, severity, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?,1)) ON CONFLICT(id) DO UPDATE SET company_id=excluded.company_id, title=excluded.title, detail=excluded.detail, severity=excluded.severity, is_active=excluded.is_active', [id, i.company_id || null, i.title, i.detail, i.severity, created_at, (i as any).is_active ?? 1]);
    return { id, created_at, ...i } as LocalInsight;
}
export function updateInsight(id: string, patch: Partial<LocalInsight>) {
    const cur = get('SELECT id, company_id, title, detail, severity, created_at, is_active FROM insights WHERE id = ?', [id]) as any;
    if (!cur) return null;
    const next = { ...cur, ...patch } as LocalInsight;
    run('UPDATE insights SET company_id = ?, title = ?, detail = ?, severity = ?, is_active = COALESCE(?, is_active) WHERE id = ?', [next.company_id || null, next.title, next.detail, next.severity, next.is_active, id]);
    return next;
}
export function deactivateInsight(id: string) {
    const res = run('UPDATE insights SET is_active = 0 WHERE id = ?', [id]);
    return res.changes > 0;
}
