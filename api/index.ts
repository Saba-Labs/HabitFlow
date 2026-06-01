import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServerlessHandler } from "../server/serverless-handler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const appHandler = await getServerlessHandler();
    return await appHandler(req, res);
  } catch (error) {
    console.error("[API] Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
