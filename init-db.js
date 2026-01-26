const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || './sqlite.db';
const db = new Database(dbPath);

// Check if tables exist
const result = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='products'
`).get();

if (!result) {
  console.log('Initializing database schema...');
  
  // Import and use drizzle-kit push programmatically
  const { execSync } = require('child_process');
  
  // Use DRIZZLE_KIT_NO_CONFIRM to skip prompts
  process.env.DRIZZLE_KIT_NO_CONFIRM = 'true';
  
  try {
    execSync('npx drizzle-kit push --force', {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, DRIZZLE_KIT_NO_CONFIRM: 'true' }
    });
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
} else {
  console.log('Database tables already exist.');
}

db.close();



