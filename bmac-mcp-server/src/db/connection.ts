import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { dirname } from 'path';
import { mkdirSync } from 'fs';

// Create the connection
// Note: dotenv.config() is called in index.ts before this module is imported
// The connection is initialized lazily when db is first accessed

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

function initializeDb() {
  if (!dbInstance) {
    const dbPath = process.env.DATABASE_URL || './sqlite.db';
    
    // Ensure the directory exists
    try {
      const dbDir = dirname(dbPath);
      mkdirSync(dbDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    sqliteInstance = new Database(dbPath);
    dbInstance = drizzle(sqliteInstance, { schema });
  }
  return dbInstance;
}

// Export a getter that initializes on first access
export const db = new Proxy({} as any, {
  get(_target, prop) {
    return initializeDb()[prop as keyof typeof dbInstance];
  }
}) as ReturnType<typeof drizzle>;

// Re-export schema types and tables
export {
  products,
  productVariants,
  digitalAssets,
  users,
  roles,
  productRequests,
  productProviders,
  productPrices,
  freeDayRequests,
} from './schema.js';

