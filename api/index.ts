import "dotenv/config";
import { createServer } from "../server";
import serverless from "serverless-http";

let handler: any;

export default async (req: any, res: any) => {
  if (!handler) {
    const app = await createServer();
    handler = serverless(app);
  }
  return handler(req, res);
};
