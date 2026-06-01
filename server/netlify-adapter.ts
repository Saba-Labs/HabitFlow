import type { Express, Request, Response, NextFunction } from "express";
import { Readable } from "node:stream";

export interface NetlifyEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | null> | null;
  rawUrl?: string;
}

export interface NetlifyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function normalizeHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

function buildPath(event: NetlifyEvent): string {
  if (event.path?.startsWith("/api")) {
    return event.path;
  }
  if (event.rawUrl) {
    try {
      return new URL(event.rawUrl).pathname;
    } catch {
      /* fall through */
    }
  }
  return event.path || "/";
}

function buildQuery(event: NetlifyEvent): string {
  const params = event.queryStringParameters;
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function getRawBody(event: NetlifyEvent): string {
  if (!event.body) return "";
  return event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
}

/** Bridge Netlify function events to Express (serverless-http is unreliable on Netlify + Express 5). */
export function invokeExpress(
  app: Express,
  event: NetlifyEvent,
): Promise<NetlifyResult> {
  const path = buildPath(event) + buildQuery(event);
  const headers = normalizeHeaders(event.headers);
  const rawBody = getRawBody(event);
  const hasBody = rawBody.length > 0 && event.httpMethod !== "GET" && event.httpMethod !== "HEAD";

  if (hasBody) {
    headers["content-length"] = String(Buffer.byteLength(rawBody, "utf8"));
    if (!headers["content-type"]) {
      headers["content-type"] = "application/json";
    }
  }

  return new Promise((resolve, reject) => {
    const reqStream = hasBody
      ? Readable.from([Buffer.from(rawBody, "utf8")])
      : Readable.from([]);

    const req = Object.assign(reqStream, {
      method: event.httpMethod,
      url: path,
      headers,
      httpVersion: "1.1",
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      connection: {},
      socket: {},
      get(name: string) {
        return headers[name.toLowerCase()];
      },
      header(name: string) {
        return this.get(name);
      },
    }) as unknown as Request;

    let settled = false;
    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};
    let responseBody = "";

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve({
        statusCode,
        headers: responseHeaders,
        body: responseBody,
      });
    };

    const res = {
      statusCode: 200,
      status(code: number) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      setHeader(name: string, value: string | number | readonly string[]) {
        responseHeaders[name.toLowerCase()] = String(value);
      },
      getHeader(name: string) {
        return responseHeaders[name.toLowerCase()];
      },
      getHeaders() {
        return { ...responseHeaders };
      },
      json(data: unknown) {
        if (!responseHeaders["content-type"]) {
          this.setHeader("Content-Type", "application/json");
        }
        responseBody = JSON.stringify(data);
        finish();
      },
      send(data: string | Buffer) {
        responseBody = typeof data === "string" ? data : data.toString("utf8");
        finish();
      },
      end(data?: string | Buffer) {
        if (data != null) {
          responseBody = typeof data === "string" ? data : data.toString("utf8");
        }
        finish();
      },
    } as unknown as Response;

    const next: NextFunction = (err?: unknown) => {
      if (err) {
        if (!settled) {
          settled = true;
          reject(err);
        }
        return;
      }
      if (!settled) {
        finish();
      }
    };

    try {
      app(req, res, next);
    } catch (err) {
      reject(err);
    }
  });
}
