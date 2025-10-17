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
    
    -- User management tables
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('consultant', 'client')),
      avatar_url TEXT,
      phone TEXT,
      created_at TEXT NOT NULL,
      last_login TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    
    -- Client-consultant relationships
    CREATE TABLE IF NOT EXISTS client_relationships (
      id TEXT PRIMARY KEY,
      consultant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      created_at TEXT NOT NULL,
      FOREIGN KEY(consultant_id) REFERENCES users(id),
      FOREIGN KEY(client_id) REFERENCES users(id),
      FOREIGN KEY(company_id) REFERENCES companies(id),
      UNIQUE(consultant_id, client_id, company_id)
    );
    
    -- Documents management
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_content TEXT, -- base64 content for demo
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
      reviewed_by TEXT,
      review_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(company_id) REFERENCES companies(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id),
      FOREIGN KEY(reviewed_by) REFERENCES users(id)
    );
    
    -- Reports management
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      report_type TEXT NOT NULL CHECK (report_type IN ('P&L', 'Balance Sheet', 'Cash Flow', 'Custom', 'Tax Report', 'Management Report')),
      period TEXT NOT NULL,
      file_url TEXT,
      file_content TEXT, -- base64 content for demo
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'submitted')),
      approved_by TEXT,
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      approved_at TEXT,
      rejected_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(company_id) REFERENCES companies(id),
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(approved_by) REFERENCES users(id)
    );
    
    -- Support tickets management
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      assigned_to TEXT,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      ticket_type TEXT NOT NULL CHECK (ticket_type IN ('technical', 'report', 'compliance', 'billing', 'general')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'in_progress', 'resolved', 'closed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(company_id) REFERENCES companies(id),
      FOREIGN KEY(created_by) REFERENCES users(id),
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );
    
    -- Ticket comments/responses
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_internal INTEGER NOT NULL DEFAULT 0, -- internal notes vs client-visible
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id),
      FOREIGN KEY(author_id) REFERENCES users(id)
    );
    
        -- Document comments
        CREATE TABLE IF NOT EXISTS document_comments (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            author_id TEXT NOT NULL,
            message TEXT NOT NULL,
            is_internal INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(document_id) REFERENCES documents(id),
            FOREIGN KEY(author_id) REFERENCES users(id)
        );
    
        -- Report comments
        CREATE TABLE IF NOT EXISTS report_comments (
            id TEXT PRIMARY KEY,
            report_id TEXT NOT NULL,
            author_id TEXT NOT NULL,
            message TEXT NOT NULL,
            is_internal INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(report_id) REFERENCES reports(id),
            FOREIGN KEY(author_id) REFERENCES users(id)
        );
    
    -- Notifications management
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL CHECK (notification_type IN ('document', 'report', 'ticket', 'system', 'billing')),
      reference_id TEXT, -- ID of related document/report/ticket
      reference_type TEXT CHECK (reference_type IN ('document', 'report', 'ticket', 'user', 'company')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      read_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id)
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
    // Clear all data in correct order (reverse foreign key dependencies)
    run('PRAGMA foreign_keys = OFF'); // Temporarily disable FK constraints
    
    run('DELETE FROM support_tickets');
    run('DELETE FROM reports'); 
    run('DELETE FROM documents');
    run('DELETE FROM client_relationships');
    run('DELETE FROM general_ledger');
    run('DELETE FROM adjustments');  
    run('DELETE FROM insights');
    run('DELETE FROM series');
    run('DELETE FROM users');
    run('DELETE FROM companies');
    run('DELETE FROM exchange_rates');
    
    run('PRAGMA foreign_keys = ON'); // Re-enable FK constraints
    
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
    
    // Demo users - consultants and clients
    const users = [
        // Consultants
        { id: 'consultant-1', email: 'admin@demo.com', username: 'admin', full_name: 'Alex Johnson', role: 'consultant', phone: '+234-901-234-5678' },
        { id: 'consultant-2', email: 'sarah.wilson@consultflow.com', username: 'sarah.wilson', full_name: 'Sarah Wilson', role: 'consultant', phone: '+27-11-123-4567' },
        
        // Client users for each company
        { id: 'client-lagos', email: 'ceo@techflow.ng', username: 'techflow.ceo', full_name: 'Adebayo Okonkwo', role: 'client', phone: '+234-803-456-7890' },
        { id: 'client-nairobi', email: 'finance@ealogistics.ke', username: 'ealogistics.finance', full_name: 'Grace Wanjiku', role: 'client', phone: '+254-20-123-4567' },
        { id: 'client-capetown', email: 'cfo@southernmining.za', username: 'southernmining.cfo', full_name: 'Pieter van der Merwe', role: 'client', phone: '+27-21-987-6543' },
        { id: 'client-accra', email: 'owner@agritegh.com', username: 'agritech.owner', full_name: 'Kwame Asante', role: 'client', phone: '+233-24-567-8901' },
        { id: 'client-casablanca', email: 'director@maghrebtrading.ma', username: 'maghreb.director', full_name: 'Fatima El Mansouri', role: 'client', phone: '+212-522-345-678' },
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
        // Insert users first
        const now = new Date().toISOString();
        for (const user of users) {
            run('INSERT OR REPLACE INTO users (id, email, username, full_name, role, phone, created_at, last_login, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)', 
                [user.id, user.email, user.username, user.full_name, user.role, user.phone, now, now]);
        }
        
        // Insert companies with full profile data
        for (const comp of companies) {
            run('INSERT OR REPLACE INTO companies (id, name, currency, country, sector, established, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', 
                [comp.id, comp.name, comp.currency, comp.country, comp.sector, comp.established]);
        }
        
        // Create client-consultant relationships
        const clientCompanyMap = [
            { companyId: 'lagos-ng', clientId: 'client-lagos', consultantId: 'consultant-1' },
            { companyId: 'nairobi-ke', clientId: 'client-nairobi', consultantId: 'consultant-2' },
            { companyId: 'cape-town-za', clientId: 'client-capetown', consultantId: 'consultant-1' },
            { companyId: 'accra-gh', clientId: 'client-accra', consultantId: 'consultant-2' },
            { companyId: 'casablanca-ma', clientId: 'client-casablanca', consultantId: 'consultant-1' },
        ];
        
        clientCompanyMap.forEach(rel => {
            const relId = `rel-${rel.consultantId}-${rel.clientId}-${rel.companyId}`;
            run('INSERT OR REPLACE INTO client_relationships (id, consultant_id, client_id, company_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [relId, rel.consultantId, rel.clientId, rel.companyId, 'active', now]);
        });
        
        // Generate 24 months of series data for each company
        const dates: string[] = [];
        for (let i = 23; i >= 0; i--) { 
            const d = new Date(now); 
            d.setMonth(d.getMonth() - i); 
            const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10); 
            dates.push(iso); 
        }
        
        // Generate data for each company with realistic business profiles
        companies.forEach((company, companyIndex) => {
            // Find the client and consultant for this company
            const relationship = clientCompanyMap.find(rel => rel.companyId === company.id);
            const clientId = relationship?.clientId;
            const consultantId = relationship?.consultantId;
            
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
                        [glId, company.id, date, entry.account_name, entry.account_code, entry.debit, entry.credit, `JE-${date}`, `Monthly ${entry.account_name} entry`, now]);
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
                            [bsId, company.id, date, entry.account_name, entry.account_code, entry.debit, entry.credit, `BS-${date}`, `Quarterly ${entry.account_name} balance`, now]);
                    });
                }
            });
            
            // Generate sample documents for each company
            if (clientId && consultantId) {
                const documents = [
                    { fileName: 'Bank_Statement_Dec_2024.pdf', type: 'pdf', status: 'pending', description: 'Monthly bank statement for reconciliation' },
                    { fileName: 'Expense_Receipts_Nov_2024.xlsx', type: 'xlsx', status: 'reviewed', description: 'Collection of expense receipts for November' },
                    { fileName: 'Invoice_Template_Update.docx', type: 'docx', status: 'approved', description: 'Updated invoice template with new company branding' },
                    { fileName: 'Tax_Certificate_2024.pdf', type: 'pdf', status: 'pending', description: 'Annual tax compliance certificate' },
                ];
                
                documents.forEach((doc, idx) => {
                    const docId = `${company.id}-doc-${idx}-${Date.now()}`;
                    const daysAgo = Math.floor(Math.random() * 30) + 1; // Random days in the past month
                    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
                    
                    run('INSERT INTO documents (id, company_id, uploaded_by, file_name, file_type, file_size, description, status, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
                        [docId, company.id, clientId, doc.fileName, doc.type, Math.floor(Math.random() * 2000000) + 50000, doc.description, doc.status, createdAt, createdAt]);
                });
            }
            
            // Generate sample reports for each company
            if (consultantId) {
                const reports = [
                    { title: 'Monthly P&L Statement - December 2024', type: 'P&L', period: 'Dec 2024', status: 'pending_approval' },
                    { title: 'Balance Sheet - Q4 2024', type: 'Balance Sheet', period: 'Q4 2024', status: 'approved' },
                    { title: 'Cash Flow Statement - November 2024', type: 'Cash Flow', period: 'Nov 2024', status: 'rejected' },
                    { title: 'Management Report - Q4 2024', type: 'Management Report', period: 'Q4 2024', status: 'submitted' },
                ];
                
                reports.forEach((rep, idx) => {
                    const repId = `${company.id}-rep-${idx}-${Date.now()}`;
                    const daysAgo = Math.floor(Math.random() * 20) + 5; // Random days in the past 3 weeks
                    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
                    
                    run('INSERT INTO reports (id, company_id, created_by, title, report_type, period, status, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
                        [repId, company.id, consultantId, rep.title, rep.type, rep.period, rep.status, createdAt, createdAt]);
                });
            }
            
            // Generate sample support tickets for each company
            if (clientId && consultantId) {
                const tickets = [
                    { subject: 'Unable to download December P&L report', description: 'When I click the download button for the December P&L report, I get a 404 error. Can you please help?', type: 'technical', priority: 'medium', status: 'pending' },
                    { subject: 'Question about VAT calculation method', description: 'I noticed the VAT calculations in our recent reports seem different from previous months. Can you explain the methodology used?', type: 'compliance', priority: 'low', status: 'resolved' },
                    { subject: 'Request for cash flow projection update', description: 'We need an updated cash flow projection for the next 6 months for our board presentation.', type: 'report', priority: 'high', status: 'in_progress' },
                ];
                
                tickets.forEach((ticket, idx) => {
                    const ticketId = `${company.id}-ticket-${idx}-${Date.now()}`;
                    const daysAgo = Math.floor(Math.random() * 14) + 1; // Random days in the past 2 weeks
                    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
                    
                    run('INSERT INTO support_tickets (id, company_id, created_by, assigned_to, subject, description, ticket_type, priority, status, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
                        [ticketId, company.id, clientId, consultantId, ticket.subject, ticket.description, ticket.type, ticket.priority, ticket.status, createdAt, createdAt]);
                    
                    // Add sample comments to some tickets
                    if (idx < 2) {
                        const comments = [
                            { author: clientId, message: 'This is preventing me from reviewing the report for our board meeting tomorrow.' },
                            { author: consultantId, message: 'Thanks for reporting this issue. We are looking into it and will have a fix shortly.' },
                        ];
                        
                        comments.forEach((comment, commentIdx) => {
                            const commentId = `${ticketId}-comment-${commentIdx}-${Date.now()}`;
                            const commentCreatedAt = new Date(Date.now() - (daysAgo - commentIdx) * 24 * 60 * 60 * 1000).toISOString();
                            
                            run('INSERT INTO ticket_comments (id, ticket_id, author_id, message, created_at, is_active) VALUES (?, ?, ?, ?, ?, 1)',
                                [commentId, ticketId, comment.author, comment.message, commentCreatedAt]);
                        });
                    }
                });
            }
            
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
                    now
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
                    [insightId, company.id, insight.title, insight.detail, insight.severity, now]);
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

// User management helpers
export type LocalUser = {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: 'consultant' | 'client';
    avatar_url?: string;
    phone?: string;
    created_at: string;
    last_login?: string;
    is_active?: number;
};

export function getUser(id: string): LocalUser | null {
    return get('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]) as LocalUser | null;
}

export function getUserByEmail(email: string): LocalUser | null {
    return get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]) as LocalUser | null;
}

export function getUserByUsername(username: string): LocalUser | null {
    return get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]) as LocalUser | null;
}

export function listUsers(role?: 'consultant' | 'client'): LocalUser[] {
    if (role) {
        return query('SELECT * FROM users WHERE role = ? AND is_active = 1 ORDER BY full_name', [role]) as LocalUser[];
    }
    return query('SELECT * FROM users WHERE is_active = 1 ORDER BY full_name') as LocalUser[];
}

export function updateUserLastLogin(userId: string): boolean {
    const res = run('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), userId]);
    return res.changes > 0;
}

// Client relationship helpers
export type LocalClientRelationship = {
    id: string;
    consultant_id: string;
    client_id: string;
    company_id: string;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
};

export function getClientsByConsultant(consultantId: string): Array<{
    relationship: LocalClientRelationship;
    client: LocalUser;
    company: LocalCompany;
}> {
    const relationships = query(`
        SELECT r.*, u.full_name as client_name, u.email as client_email, u.phone as client_phone,
               c.name as company_name, c.currency, c.country, c.sector
        FROM client_relationships r
        JOIN users u ON r.client_id = u.id
        JOIN companies c ON r.company_id = c.id
        WHERE r.consultant_id = ? AND r.status = 'active' AND u.is_active = 1 AND c.is_active = 1
        ORDER BY c.name
    `, [consultantId]) as any[];

    return relationships.map(row => ({
        relationship: {
            id: row.id,
            consultant_id: row.consultant_id,
            client_id: row.client_id,
            company_id: row.company_id,
            status: row.status,
            created_at: row.created_at,
        },
        client: {
            id: row.client_id,
            email: row.client_email,
            username: row.client_id,
            full_name: row.client_name,
            role: 'client' as const,
            phone: row.client_phone,
            created_at: row.created_at,
        },
        company: {
            id: row.company_id,
            name: row.company_name,
            currency: row.currency,
        },
    }));
}

// Document management helpers
export type LocalDocument = {
    id: string;
    company_id: string;
    uploaded_by: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_content?: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'approved' | 'rejected';
    reviewed_by?: string;
    review_notes?: string;
    created_at: string;
    updated_at: string;
    is_active?: number;
};

export function getDocuments(companyId: string, status?: string): LocalDocument[] {
    const sql = status 
        ? 'SELECT * FROM documents WHERE company_id = ? AND status = ? AND is_active = 1 ORDER BY created_at DESC'
        : 'SELECT * FROM documents WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC';
    const params = status ? [companyId, status] : [companyId];
    return query(sql, params) as LocalDocument[];
}

export function getDocumentById(id: string): LocalDocument | null {
    return get('SELECT * FROM documents WHERE id = ? AND is_active = 1', [id]) as LocalDocument | null;
}

export function updateDocumentStatus(documentId: string, status: 'pending' | 'reviewed' | 'approved' | 'rejected', reviewedBy: string, reviewNotes?: string): boolean {
    const res = run('UPDATE documents SET status = ?, reviewed_by = ?, review_notes = ?, updated_at = ? WHERE id = ?', 
        [status, reviewedBy, reviewNotes || null, new Date().toISOString(), documentId]);
    return res.changes > 0;
}

export function updateDocument(documentId: string, patch: Partial<LocalDocument>): LocalDocument | null {
    const cur = get('SELECT * FROM documents WHERE id = ? AND is_active = 1', [documentId]) as LocalDocument | null;
    if (!cur) return null;
    const next: LocalDocument = { ...cur, ...patch, updated_at: new Date().toISOString() } as any;
    run('UPDATE documents SET file_name = ?, description = ?, file_type = ?, file_size = ?, updated_at = ? WHERE id = ?', [
        next.file_name, next.description || null, next.file_type, next.file_size, next.updated_at, documentId
    ]);
    return next;
}

export function uploadDocument(doc: Omit<LocalDocument, 'id' | 'created_at' | 'updated_at'>): LocalDocument {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    run('INSERT INTO documents (id, company_id, uploaded_by, file_name, file_type, file_size, file_content, description, status, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [id, doc.company_id, doc.uploaded_by, doc.file_name, doc.file_type, doc.file_size, doc.file_content || null, doc.description || null, doc.status || 'pending', now, now]);
    
    return { ...doc, id, created_at: now, updated_at: now };
}

// Report management helpers
export type LocalReport = {
    id: string;
    company_id: string;
    created_by: string;
    title: string;
    report_type: 'P&L' | 'Balance Sheet' | 'Cash Flow' | 'Custom' | 'Tax Report' | 'Management Report';
    period: string;
    file_url?: string;
    file_content?: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'submitted';
    approved_by?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
    approved_at?: string;
    rejected_at?: string;
    is_active?: number;
};

export function getReports(companyId: string, status?: string): LocalReport[] {
    const sql = status 
        ? 'SELECT * FROM reports WHERE company_id = ? AND status = ? AND is_active = 1 ORDER BY created_at DESC'
        : 'SELECT * FROM reports WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC';
    const params = status ? [companyId, status] : [companyId];
    return query(sql, params) as LocalReport[];
}

export function getReportById(id: string): LocalReport | null {
    return get('SELECT * FROM reports WHERE id = ? AND is_active = 1', [id]) as LocalReport | null;
}

export function createReport(report: Omit<LocalReport, 'id' | 'created_at' | 'updated_at'>): LocalReport {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    run('INSERT INTO reports (id, company_id, created_by, title, report_type, period, file_url, file_content, status, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [id, report.company_id, report.created_by, report.title, report.report_type, report.period, report.file_url || null, report.file_content || null, report.status || 'draft', now, now]);
    
    return { ...report, id, created_at: now, updated_at: now };
}

export function updateReport(reportId: string, patch: Partial<LocalReport>): LocalReport | null {
    const cur = get('SELECT * FROM reports WHERE id = ? AND is_active = 1', [reportId]) as LocalReport | null;
    if (!cur) return null;
    const next: LocalReport = { ...cur, ...patch, updated_at: new Date().toISOString() } as any;
    run('UPDATE reports SET title = ?, report_type = ?, period = ?, file_url = COALESCE(?, file_url), file_content = COALESCE(?, file_content), updated_at = ? WHERE id = ?', [
        next.title, next.report_type, next.period, next.file_url, next.file_content, next.updated_at, reportId
    ]);
    return next;
}

export function updateReportStatus(reportId: string, status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'submitted', approvedBy?: string, rejectionReason?: string): boolean {
    const now = new Date().toISOString();
    let sql = 'UPDATE reports SET status = ?, updated_at = ?';
    const params: any[] = [status, now];
    
    if (status === 'approved' && approvedBy) {
        sql += ', approved_by = ?, approved_at = ?';
        params.push(approvedBy, now);
    } else if (status === 'rejected' && rejectionReason) {
        sql += ', rejection_reason = ?, rejected_at = ?';
        params.push(rejectionReason, now);
    }
    
    sql += ' WHERE id = ?';
    params.push(reportId);
    
    const res = run(sql, params);
    return res.changes > 0;
}

// Support ticket management helpers
export type LocalSupportTicket = {
    id: string;
    company_id: string;
    created_by: string;
    assigned_to?: string;
    subject: string;
    description: string;
    ticket_type: 'technical' | 'report' | 'compliance' | 'billing' | 'general';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    is_active?: number;
};

export type LocalTicketComment = {
    id: string;
    ticket_id: string;
    author_id: string;
    message: string;
    is_internal?: number;
    created_at: string;
    is_active?: number;
};

export function getTickets(companyId: string, status?: string): LocalSupportTicket[] {
    const sql = status 
        ? 'SELECT * FROM support_tickets WHERE company_id = ? AND status = ? AND is_active = 1 ORDER BY updated_at DESC'
        : 'SELECT * FROM support_tickets WHERE company_id = ? AND is_active = 1 ORDER BY updated_at DESC';
    const params = status ? [companyId, status] : [companyId];
    return query(sql, params) as LocalSupportTicket[];
}

export function getTicketById(id: string): LocalSupportTicket | null {
    return get('SELECT * FROM support_tickets WHERE id = ? AND is_active = 1', [id]) as LocalSupportTicket | null;
}

export function createTicket(ticket: Omit<LocalSupportTicket, 'id' | 'created_at' | 'updated_at'>): LocalSupportTicket {
    const id = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    run('INSERT INTO support_tickets (id, company_id, created_by, assigned_to, subject, description, ticket_type, priority, status, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [id, ticket.company_id, ticket.created_by, ticket.assigned_to || null, ticket.subject, ticket.description, ticket.ticket_type, ticket.priority, ticket.status || 'open', now, now]);
    
    return { ...ticket, id, created_at: now, updated_at: now };
}

export function updateTicketStatus(ticketId: string, status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed'): boolean {
    const now = new Date().toISOString();
    let sql = 'UPDATE support_tickets SET status = ?, updated_at = ?';
    const params: any[] = [status, now];
    
    if (status === 'resolved' || status === 'closed') {
        sql += ', resolved_at = ?';
        params.push(now);
    }
    
    sql += ' WHERE id = ?';
    params.push(ticketId);
    
    const res = run(sql, params);
    return res.changes > 0;
}

export function updateTicket(ticketId: string, patch: Partial<LocalSupportTicket>): LocalSupportTicket | null {
    const cur = get('SELECT * FROM support_tickets WHERE id = ? AND is_active = 1', [ticketId]) as LocalSupportTicket | null;
    if (!cur) return null;
    const next: LocalSupportTicket = { ...cur, ...patch, updated_at: new Date().toISOString() } as any;
    run('UPDATE support_tickets SET subject = ?, description = ?, ticket_type = ?, priority = ?, assigned_to = COALESCE(?, assigned_to), updated_at = ? WHERE id = ?', [
        next.subject, next.description, next.ticket_type, next.priority, next.assigned_to, next.updated_at, ticketId
    ]);
    return next;
}

export function getTicketComments(ticketId: string): LocalTicketComment[] {
    return query('SELECT * FROM ticket_comments WHERE ticket_id = ? AND is_active = 1 ORDER BY created_at ASC', [ticketId]) as LocalTicketComment[];
}

export function addTicketComment(ticketId: string, authorId: string, message: string, isInternal = false): LocalTicketComment {
    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    run('INSERT INTO ticket_comments (id, ticket_id, author_id, message, is_internal, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [id, ticketId, authorId, message, isInternal ? 1 : 0, now]);
    
    // Update ticket's updated_at timestamp
    run('UPDATE support_tickets SET updated_at = ? WHERE id = ?', [now, ticketId]);
    
    return { id, ticket_id: ticketId, author_id: authorId, message, is_internal: isInternal ? 1 : 0, created_at: now, is_active: 1 };
}

// Document comment helpers
export type LocalDocumentComment = {
    id: string;
    document_id: string;
    author_id: string;
    message: string;
    is_internal?: number;
    created_at: string;
    is_active?: number;
};

export function getDocumentComments(documentId: string): LocalDocumentComment[] {
    return query('SELECT * FROM document_comments WHERE document_id = ? AND is_active = 1 ORDER BY created_at ASC', [documentId]) as LocalDocumentComment[];
}

export function addDocumentComment(documentId: string, authorId: string, message: string, isInternal = false): LocalDocumentComment {
    const id = `doccomment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    run('INSERT INTO document_comments (id, document_id, author_id, message, is_internal, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', [id, documentId, authorId, message, isInternal ? 1 : 0, now]);
    // Touch document updated_at
    run('UPDATE documents SET updated_at = ? WHERE id = ?', [now, documentId]);
    return { id, document_id: documentId, author_id: authorId, message, is_internal: isInternal ? 1 : 0, created_at: now, is_active: 1 };
}

// Report comment helpers
export type LocalReportComment = {
    id: string;
    report_id: string;
    author_id: string;
    message: string;
    is_internal?: number;
    created_at: string;
    is_active?: number;
};

export function getReportComments(reportId: string): LocalReportComment[] {
    return query('SELECT * FROM report_comments WHERE report_id = ? AND is_active = 1 ORDER BY created_at ASC', [reportId]) as LocalReportComment[];
}

export function addReportComment(reportId: string, authorId: string, message: string, isInternal = false): LocalReportComment {
    const id = `repcomment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    run('INSERT INTO report_comments (id, report_id, author_id, message, is_internal, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', [id, reportId, authorId, message, isInternal ? 1 : 0, now]);
    // Touch report updated_at
    run('UPDATE reports SET updated_at = ? WHERE id = ?', [now, reportId]);
    return { id, report_id: reportId, author_id: authorId, message, is_internal: isInternal ? 1 : 0, created_at: now, is_active: 1 };
}

// Notification helpers
export type LocalNotification = {
    id: string;
    user_id: string;
    title: string;
    message: string;
    notification_type: 'document' | 'report' | 'ticket' | 'system' | 'billing';
    reference_id?: string;
    reference_type?: 'document' | 'report' | 'ticket' | 'user' | 'company';
    is_read?: number;
    created_at: string;
    read_at?: string;
    is_active?: number;
};

export function createNotification(notification: Omit<LocalNotification, 'id' | 'created_at'>): LocalNotification {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    run('INSERT INTO notifications (id, user_id, title, message, notification_type, reference_id, reference_type, is_read, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [id, notification.user_id, notification.title, notification.message, notification.notification_type, notification.reference_id || null, notification.reference_type || null, notification.is_read || 0, now]);
    
    return { ...notification, id, created_at: now };
}

export function getUserNotifications(userId: string, unreadOnly = false): LocalNotification[] {
    const sql = unreadOnly 
        ? 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 AND is_active = 1 ORDER BY created_at DESC'
        : 'SELECT * FROM notifications WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 50';
    return query(sql, [userId]) as LocalNotification[];
}

export function markNotificationAsRead(notificationId: string): boolean {
    const res = run('UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?', [new Date().toISOString(), notificationId]);
    return res.changes > 0;
}

export function markAllNotificationsAsRead(userId: string): boolean {
    const res = run('UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0', [new Date().toISOString(), userId]);
    return res.changes > 0;
}
