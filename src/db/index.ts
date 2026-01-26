import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { dirname } from 'path';
import { mkdirSync } from 'fs';

// Create the connection
export const dbPath = process.env.DATABASE_URL || './sqlite.db';

// Ensure the directory exists
try {
  const dbDir = dirname(dbPath);
  mkdirSync(dbDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Initialize database tables if they don't exist
// Import after db creation to avoid circular dependency
import { initializeDatabase } from './init';
initializeDatabase(sqlite);

export * from './schema';
