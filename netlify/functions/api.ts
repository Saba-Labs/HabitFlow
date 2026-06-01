import type { Express } from "express";
import { createServer } from "../../server/index";
import { invokeExpress } from "../../server/netlify-adapter";

let app: Express | null = null;

export const handler = async (event: Parameters<typeof invokeExpress>[1]) => {
  try {
    if (!app) {
      app = await createServer();
    }

    const result = await invokeExpress(app, event);

    return {
      statusCode: result.statusCode,
      headers: {
        "Content-Type": "application/json",
        ...result.headers,
      },
      body: result.body,
    };
  } catch (error) {
    console.error("[Netlify API] Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
