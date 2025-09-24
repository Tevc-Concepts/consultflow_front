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
    CREATE TABLE IF NOT EXISTS exchange_rates (
      month TEXT PRIMARY KEY,
      ngn_usd REAL,
      ngn_cfa REAL
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
    try { d.exec(`ALTER TABLE entities ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch { }
    try { d.exec(`ALTER TABLE series ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch { }
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
    // Minimal seed mirroring demoDb companies and 24 months series for 'lagos' only (keep small)
    const companies = [
        { id: 'lagos', name: 'Lagos Retail Ltd', currency: 'NGN' },
    ];
    transactional(() => {
        for (const comp of companies) run('INSERT OR REPLACE INTO companies (id, name, currency, is_active) VALUES (?, ?, ?, 1)', [comp.id, comp.name, comp.currency]);
        const now = new Date();
        const dates: string[] = [];
        for (let i = 23; i >= 0; i--) { const d = new Date(now); d.setMonth(d.getMonth() - i); const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10); dates.push(iso); }
        let cash = 8_500_000;
        dates.forEach((date, i) => {
            const month = new Date(date).getMonth();
            const seasonal = [0.95, 0.92, 0.98, 1.02, 1.05, 1.07, 1.1, 1.12, 1.15, 1.25, 1.35, 1.5][month];
            const baseRevenue = 5_000_000; const growth = 1 + i * 0.01; const inflation = i > 6 ? 1.02 : 1;
            let revenue = Math.round(baseRevenue * seasonal * growth * inflation);
            const cogs = Math.round(revenue * (0.4 + Math.sin(i) * 0.02));
            const expenses = Math.round(revenue * 0.45 * (1 + i / 100));
            cash += (revenue - cogs - expenses);
            run('INSERT OR REPLACE INTO series (company_id, date, revenue, cogs, expenses, cash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', ['lagos', date, revenue, cogs, expenses, cash]);
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
