import { neon } from "@neondatabase/serverless";

// sql is initialised lazily so the module can be imported even when
// DATABASE_URL is missing (memory-store fallback path).
let _sql: ReturnType<typeof neon> | null = null;
let isDbAvailable = false;

function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) return null;
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export const isDbReady = () => isDbAvailable;

export const query = async (text: string, params?: any[]) => {
  const sql = getSql();
  if (!sql) throw new Error("Database not available");
  const rows = await sql(text, params ?? []);
  return { rows: rows as any[] };
};

export const initDb = async () => {
  const sql = getSql();
  if (!sql) {
    console.log("[DB] DATABASE_URL not set, skipping init");
    return;
  }

  // Test connection first
  await sql`SELECT 1`;
  console.log("[DB] ✓ Connection successful");
  isDbAvailable = true;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completion_percentage INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `;

  await sql`
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
  `;

  console.log("[DB] ✓ Tables ready");
};