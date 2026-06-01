import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { getHabits, addHabit, updateHabit, deleteHabit } from "./routes/habits";
import { getTodayRecord, toggleHabit, getRecordByDate } from "./routes/records";
import { signup, login } from "./routes/auth";
import { initDb } from "./db";
import { authMiddleware } from "./auth";

export async function createServer() {
  console.log("[Server] Creating Express server...", {
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  const app = express();

  // Initialize database (optional for development)
  if (process.env.DATABASE_URL) {
    try {
      console.log("[Server] Initializing database...");
      await initDb();
      console.log("[Server] Database initialized successfully");
    } catch (err) {
      console.error("[Server] Failed to initialize database:", err);
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
      console.warn("[Server] Continuing without database connection...");
    }
  } else {
    console.log("[Server] DATABASE_URL not set, skipping database initialization");
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, _res, next) => {
    console.log(`[Server] ${req.method} ${req.path}`, {
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    console.log("[Server] /api/ping called");
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes (no middleware required)
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);

  // Protected routes - require auth
  app.use("/api/habits", authMiddleware);
  app.use("/api/records", authMiddleware);

  // Habits routes
  app.get("/api/habits", getHabits);
  app.post("/api/habits", addHabit);
  app.put("/api/habits/:habitId", updateHabit);
  app.delete("/api/habits/:habitId", deleteHabit);

  // Records routes
  app.get("/api/records/today", getTodayRecord);
  app.get("/api/records/date/:date", getRecordByDate);
  app.put("/api/records/:recordId/habits/:habitId", toggleHabit);

  // SPA fallback - handled by Vite in development, by vercel.json filesystem handler in production
  // Do NOT add a catch-all route here on Vercel, it breaks the routing

  console.log("[Server] Server created successfully", {
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  return app;
}
