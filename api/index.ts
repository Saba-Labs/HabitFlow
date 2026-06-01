import { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";

let handler: ReturnType<typeof serverless>;

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (!handler) {
      // Inline createServer entirely — no external file imports needed
      const express = (await import("express")).default;
      const cors = (await import("cors")).default;
      const { neon } = await import("@neondatabase/serverless");
      const bcrypt = await import("bcryptjs");
      const jwt = await import("jsonwebtoken");

      const app = express();
      app.use(cors());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || "dev-secret-key-change-in-production";

      // ─── DB ────────────────────────────────────────────────────────────────
      const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

      if (sql) {
        try {
          await sql`SELECT 1`;
          console.log("[DB] Connected");
          await sql`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`;
          await sql`CREATE TABLE IF NOT EXISTS habits (
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
          )`;
          await sql`CREATE TABLE IF NOT EXISTS daily_records (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            completion_percentage INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
          )`;
          await sql`CREATE TABLE IF NOT EXISTS habit_completions (
            id TEXT PRIMARY KEY,
            record_id TEXT NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
            habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(record_id, habit_id)
          )`;
          console.log("[DB] Tables ready");
        } catch (err) {
          console.error("[DB] Init failed:", err);
        }
      } else {
        console.log("[DB] No DATABASE_URL — memory store only");
      }

      const q = async (text: string, params: any[] = []) => {
        if (!sql) throw new Error("DB not available");
        const rows = await sql(text, params);
        return { rows: rows as any[] };
      };

      const isDbReady = () => !!sql;

      // ─── In-memory fallback ────────────────────────────────────────────────
      const memUsers = new Map<string, { id: string; email: string; password_hash: string }>();

      // ─── Auth helpers ──────────────────────────────────────────────────────
      const authMiddleware = (req: any, res: any, next: any) => {
        try {
          const token = req.headers.authorization?.replace("Bearer ", "");
          if (!token) return res.status(401).json({ error: "No token provided" });
          req.user = jwt.verify(token, JWT_SECRET);
          next();
        } catch (err) {
          console.error("[Auth] Token validation failed:", err instanceof Error ? err.message : String(err));
          res.status(401).json({ error: "Invalid token" });
        }
      };

      // ─── Routes ────────────────────────────────────────────────────────────
      app.get("/api/ping", (_req: any, res: any) => res.json({ message: "pong" }));

      // Signup
      app.post("/api/auth/signup", async (req: any, res: any) => {
        try {
          const { email, password } = req.body;
          if (!email || !password) return res.status(400).json({ error: "Email and password required" });

          const passwordHash = await bcrypt.hash(password, 10);
          const userId = `user_${Date.now()}`;

          if (!isDbReady()) {
            for (const u of memUsers.values()) {
              if (u.email === email) return res.status(409).json({ error: "Email already registered" });
            }
            memUsers.set(userId, { id: userId, email, password_hash: passwordHash });
            const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
            return res.status(201).json({ token, userId, email });
          }

          const existing = await q("SELECT id FROM users WHERE email = $1", [email]);
          if (existing.rows.length > 0) return res.status(409).json({ error: "Email already registered" });

          await q("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)", [userId, email, passwordHash]);
          const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
          res.status(201).json({ token, userId, email });
        } catch (err) {
          console.error("Signup error:", err);
          res.status(500).json({ error: "Signup failed" });
        }
      });

      // Login
      app.post("/api/auth/login", async (req: any, res: any) => {
        try {
          const { email, password } = req.body;
          if (!email || !password) return res.status(400).json({ error: "Email and password required" });

          if (!isDbReady()) {
            let user = null;
            for (const u of memUsers.values()) {
              if (u.email === email) { user = u; break; }
            }
            if (!user) return res.status(401).json({ error: "Invalid email or password" });
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) return res.status(401).json({ error: "Invalid email or password" });
            const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: "30d" });
            return res.json({ token, userId: user.id, email });
          }

          const result = await q("SELECT id, password_hash FROM users WHERE email = $1", [email]);
          if (result.rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });

          const user = result.rows[0];
          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return res.status(401).json({ error: "Invalid email or password" });

          const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: "30d" });
          res.json({ token, userId: user.id, email });
        } catch (err) {
          console.error("Login error:", err);
          res.status(500).json({ error: "Login failed" });
        }
      });

      // Habits (protected)
      app.use("/api/habits", authMiddleware);
      app.use("/api/records", authMiddleware);

      app.get("/api/habits", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.json([]);
          const result = await q('SELECT * FROM habits WHERE user_id = $1 AND archived = FALSE ORDER BY "order"', [req.user.userId]);
          res.json(result.rows);
        } catch (err) { res.status(500).json({ error: "Failed to fetch habits" }); }
      });

      app.post("/api/habits", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.status(503).json({ error: "DB not available" });
          const { id, name, icon, color, notes, order } = req.body;
          const habitId = id || `habit_${Date.now()}`;
          const result = await q(
            `INSERT INTO habits (id, user_id, name, icon, color, notes, "order", archived) VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE) RETURNING *`,
            [habitId, req.user.userId, name, icon, color, notes || null, order || 0]
          );
          res.status(201).json(result.rows[0]);
        } catch (err) { res.status(500).json({ error: "Failed to add habit" }); }
      });

      app.put("/api/habits/:habitId", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.status(503).json({ error: "DB not available" });
          const { name, icon, color, notes } = req.body;
          const result = await q(
            `UPDATE habits SET name=$1,icon=$2,color=$3,notes=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$5 AND user_id=$6 RETURNING *`,
            [name, icon, color, notes || null, req.params.habitId, req.user.userId]
          );
          if (!result.rows[0]) return res.status(404).json({ error: "Habit not found" });
          res.json(result.rows[0]);
        } catch (err) { res.status(500).json({ error: "Failed to update habit" }); }
      });

      app.delete("/api/habits/:habitId", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.status(503).json({ error: "DB not available" });
          await q("DELETE FROM habits WHERE id=$1 AND user_id=$2", [req.params.habitId, req.user.userId]);
          res.json({ success: true });
        } catch (err) { res.status(500).json({ error: "Failed to delete habit" }); }
      });

      app.get("/api/records/today", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.json({ id: "mem", date: new Date().toISOString().split("T")[0], habits: [], completionPercentage: 0 });
          const today = new Date().toISOString().split("T")[0];
          const userId = req.user.userId;
          let result = await q(
            `SELECT dr.*, COALESCE((SELECT json_agg(json_build_object('habitId',habit_id,'completed',completed,'completedAt',completed_at)) FROM habit_completions WHERE record_id=dr.id),'[]'::json) as habits FROM daily_records dr WHERE dr.user_id=$1 AND dr.date=$2`,
            [userId, today]
          );
          if (result.rows.length === 0) {
            const recordId = `record_${today}_${userId}`;
            await q(`INSERT INTO daily_records (id,user_id,date,completion_percentage) VALUES ($1,$2,$3,0)`, [recordId, userId, today]);
            const habits = await q("SELECT id FROM habits WHERE user_id=$1 AND archived=FALSE", [userId]);
            for (const h of habits.rows) {
              await q(`INSERT INTO habit_completions (id,record_id,habit_id,completed) VALUES ($1,$2,$3,FALSE)`, [`c_${Date.now()}_${h.id}`, recordId, h.id]);
            }
            result = await q(
              `SELECT dr.*, COALESCE((SELECT json_agg(json_build_object('habitId',habit_id,'completed',completed,'completedAt',completed_at)) FROM habit_completions WHERE record_id=dr.id),'[]'::json) as habits FROM daily_records dr WHERE dr.user_id=$1 AND dr.date=$2`,
              [userId, today]
            );
          }
          const rec = result.rows[0];
          res.json({ id: rec.id, date: rec.date, habits: Array.isArray(rec.habits) ? rec.habits.filter(Boolean) : [], completionPercentage: rec.completion_percentage });
        } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch record" }); }
      });

      app.get("/api/records/date/:date", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.json({ id: "mem", date: req.params.date, habits: [], completionPercentage: 0 });
          const { date } = req.params;
          const userId = req.user.userId;
          const result = await q(
            `SELECT dr.*, COALESCE((SELECT json_agg(json_build_object('habitId',habit_id,'completed',completed,'completedAt',completed_at)) FROM habit_completions WHERE record_id=dr.id),'[]'::json) as habits FROM daily_records dr WHERE dr.user_id=$1 AND dr.date=$2`,
            [userId, date]
          );
          if (!result.rows[0]) return res.json({ id: `record_${date}_${userId}`, date, habits: [], completionPercentage: 0 });
          const rec = result.rows[0];
          res.json({ id: rec.id, date: rec.date, habits: Array.isArray(rec.habits) ? rec.habits.filter(Boolean) : [], completionPercentage: rec.completion_percentage });
        } catch (err) { res.status(500).json({ error: "Failed to fetch record" }); }
      });

      app.put("/api/records/:recordId/habits/:habitId", async (req: any, res: any) => {
        try {
          if (!isDbReady()) return res.status(503).json({ error: "DB not available" });
          const { recordId, habitId } = req.params;
          const existing = await q("SELECT completed FROM habit_completions WHERE record_id=$1 AND habit_id=$2", [recordId, habitId]);
          const newStatus = existing.rows.length > 0 ? !existing.rows[0].completed : true;
          if (existing.rows.length === 0) {
            await q(`INSERT INTO habit_completions (id,record_id,habit_id,completed,completed_at) VALUES ($1,$2,$3,$4,$5)`, [`c_${Date.now()}`, recordId, habitId, newStatus, newStatus ? new Date().toISOString() : null]);
          } else {
            await q(`UPDATE habit_completions SET completed=$1,completed_at=$2,updated_at=CURRENT_TIMESTAMP WHERE record_id=$3 AND habit_id=$4`, [newStatus, newStatus ? new Date().toISOString() : null, recordId, habitId]);
          }
          const stats = await q(`SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed FROM habit_completions WHERE record_id=$1`, [recordId]);
          const { total, completed } = stats.rows[0];
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          await q("UPDATE daily_records SET completion_percentage=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2", [pct, recordId]);
          res.json({ success: true, completed: newStatus });
        } catch (err) { res.status(500).json({ error: "Failed to toggle habit" }); }
      });

      handler = serverless(app);
    }

    return await handler(req, res);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
