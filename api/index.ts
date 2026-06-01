import { createServer } from "../server/index";
import serverless from "serverless-http";

let handler: any;

export default async (req: any, res: any) => {
  console.log(`[API] ${req.method} ${req.url}`, {
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });

  try {
    if (!handler) {
      console.log("[API] Initializing serverless handler...");
      const app = await createServer();
      handler = serverless(app);
      console.log("[API] Handler initialized successfully");
    }
    const result = await handler(req, res);
    console.log(`[API] Response sent for ${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      timestamp: new Date().toISOString(),
    });
    return result;
  } catch (error) {
    console.error(`[API] ERROR on ${req.method} ${req.url}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
