// NOTE: No dotenv import here — Vercel injects env vars automatically.
// dotenv is only used in node-build.ts for local development.
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getHabits, addHabit, updateHabit, deleteHabit } from "./routes/habits";
import { getTodayRecord, toggleHabit, getRecordByDate } from "./routes/records";
import { signup, login } from "./routes/auth";
import { initDb } from "./db";
import { authMiddleware } from "./auth";

export async function createServer() {
  console.log("[Server] Creating Express server...", {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  });

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    console.log(`[Server] ${req.method} ${req.path}`);
    next();
  });

  // Initialize database
  if (process.env.DATABASE_URL) {
    try {
      console.log("[Server] Initializing database...");
      await initDb();
      console.log("[Server] Database initialized successfully");
    } catch (err) {
      console.error("[Server] Failed to initialize database:", err);
      // Don't exit — fall back to memory store
    }
  } else {
    console.log("[Server] DATABASE_URL not set, using memory store");
  }

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE ?? "pong" });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes (public)
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);

  // Protected routes
  app.use("/api/habits", authMiddleware);
  app.use("/api/records", authMiddleware);

  app.get("/api/habits", getHabits);
  app.post("/api/habits", addHabit);
  app.put("/api/habits/:habitId", updateHabit);
  app.delete("/api/habits/:habitId", deleteHabit);

  app.get("/api/records/today", getTodayRecord);
  app.get("/api/records/date/:date", getRecordByDate);
  app.put("/api/records/:recordId/habits/:habitId", toggleHabit);

  console.log("[Server] Server created successfully");
  return app;
}