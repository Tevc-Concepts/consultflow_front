declare module 'better-sqlite3' {
    // Minimal typings to satisfy usage in localDb.ts
    namespace DatabaseNS {
        interface Statement {
            all<T = any>(params?: any[]): T[];
            get<T = any>(params?: any[]): T;
            run(params?: any[]): { changes: number };
        }
        interface Database {
            prepare(sql: string): Statement;
            exec(sql: string): void;
            transaction<T>(fn: () => T): () => T;
        }
    }
    const DatabaseCtor: {
        new(path: string): DatabaseNS.Database;
    };
    export = DatabaseCtor;
}
