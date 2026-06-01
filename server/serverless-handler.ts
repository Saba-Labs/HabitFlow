import serverless from "serverless-http";
import { createServer } from "./index";

let handler: ReturnType<typeof serverless> | undefined;

/** Lazy Express app wrapped for Vercel / Netlify serverless. */
export async function getServerlessHandler() {
  if (!handler) {
    const app = await createServer();
    handler = serverless(app);
  }
  return handler;
}
