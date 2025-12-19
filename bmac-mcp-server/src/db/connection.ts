import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Create the connection
// Note: dotenv.config() is called in index.ts before this module is imported
// The connection is initialized lazily when db is first accessed

let dbInstance: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
  if (!dbInstance) {
    const connString = process.env.DATABASE_URL;
    if (!connString) {
      throw new Error('DATABASE_URL environment variable is required. Make sure .env.local exists in the parent directory (BMAC-demo-start/.env.local) or set DATABASE_URL in your environment.');
    }
    const client = postgres(connString);
    dbInstance = drizzle(client, { schema });
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

