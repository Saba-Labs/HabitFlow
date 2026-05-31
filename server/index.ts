import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getHabits, addHabit, updateHabit, deleteHabit } from "./routes/habits";
import { getTodayRecord, toggleHabit } from "./routes/records";
import { initDb } from "./db";

export async function createServer() {
  const app = express();

  // Initialize database
  try {
    await initDb();
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
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

  // Habits routes
  app.get("/api/habits", getHabits);
  app.post("/api/habits", addHabit);
  app.put("/api/habits/:habitId", updateHabit);
  app.delete("/api/habits/:habitId", deleteHabit);

  // Records routes
  app.get("/api/records/today", getTodayRecord);
  app.put("/api/records/:recordId/habits/:habitId", toggleHabit);

  return app;
}
