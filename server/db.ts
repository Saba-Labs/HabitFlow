import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let isDbAvailable = false;

if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
}

export const isDbReady = () => isDbAvailable && sql !== null;

export const query = async (text: string, params?: any[]) => {
  if (!sql) throw new Error("Database not available");
  const rows = await sql(text, params);
  return { rows: rows as any[] };
};

export const initDb = async () => {
  if (!sql) {
    console.log("DATABASE_URL not set, database features disabled");
    return;
  }

  try {
    await sql`SELECT 1`;
    console.log("✓ Database connection successful");
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

    console.log("✓ Database tables initialized successfully");
  } catch (err) {
    console.error("✗ Database initialization error:", err);
    isDbAvailable = false;
    throw err;
  }
};
