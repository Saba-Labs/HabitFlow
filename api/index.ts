// api/index.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";

let handler: ReturnType<typeof serverless>;

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (!handler) {
      // Dynamically import the pre-built bundle
      const { createServer } = await import("../dist/server/node-build.mjs");
      const app = await createServer();
      handler = serverless(app);
    }
    return await handler(req, res);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
