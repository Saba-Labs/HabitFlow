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
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.main": "false",
  },
});

console.log("✓ API bundle built → api/server-bundle.mjs");
