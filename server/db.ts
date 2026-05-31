import { Pool } from 'pg';

let pool: Pool | null = null;
let isDbAvailable = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

export const query = async (text: string, params?: any[]) => {
  if (!isDbAvailable || !pool) {
    throw new Error('Database not available');
  }
  return pool.query(text, params);
};

export const getClient = async () => {
  if (!isDbAvailable || !pool) {
    throw new Error('Database not available');
  }
  return pool.connect();
};

export const initDb = async () => {
  if (!pool) {
    console.log('DATABASE_URL not set, database features disabled');
    return;
  }

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful');
    isDbAvailable = true;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        notes TEXT,
        "order" INT NOT NULL DEFAULT 0,
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completion_percentage INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        record_id TEXT NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(record_id, habit_id)
      )
    `);

    console.log('✓ Database tables initialized successfully');
  } catch (err) {
    console.error('✗ Database initialization error:', err);
    isDbAvailable = false;
  }
};
