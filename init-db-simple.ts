import Database from 'better-sqlite3';
import { initializeDatabase } from './src/db/init';

const dbPath = process.env.DATABASE_URL || './sqlite.db';
const db = new Database(dbPath);

console.log('Initializing database...');
initializeDatabase(db);
console.log('Database initialization complete!');

db.close();



