import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { getHabits, addHabit, updateHabit, deleteHabit } from "./routes/habits";
import { getTodayRecord, toggleHabit } from "./routes/records";
import { signup, login } from "./routes/auth";
import { initDb } from "./db";
import { authMiddleware } from "./auth";

export async function createServer() {
  const app = express();

  // Initialize database (optional for development)
  if (process.env.DATABASE_URL) {
    try {
      await initDb();
    } catch (err) {
      console.error("Failed to initialize database:", err);
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
      console.warn("Continuing without database connection...");
    }
  } else {
    console.log("DATABASE_URL not set, skipping database initialization");
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
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
  app.put("/api/records/:recordId/habits/:habitId", toggleHabit);

  // SPA fallback - handled by Vite in development, by static files in production
  if (process.env.NODE_ENV === "production") {
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../spa/index.html"));
    });
  }

  return app;
}
