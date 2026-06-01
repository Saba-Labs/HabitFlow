import { build } from "esbuild";
import path from "node:path";

await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  outfile: "api/server-bundle.mjs",
  format: "esm",
  platform: "node",
  target: "node22",
  minify: false,
  sourcemap: false,
  external: [
    "node:*",
    "fs",
    "path",
    "url",
    "http",
    "https",
    "os",
    "crypto",
    "stream",
    "util",
    "events",
    "buffer",
    "querystring",
    "child_process",
    "net",
    "tls",
    "dns",
    "dotenv",
    "dotenv/config",
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.main": "false",
  },
  banner: {
    js: `
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
    `.trim(),
  },
});

console.log("✓ API bundle built → api/server-bundle.mjs");
