import { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "./server-bundle.mjs";
import serverless from "serverless-http";

let handler: ReturnType<typeof serverless>;

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (!handler) {
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
