import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  outfile: "api/server-bundle.mjs",
  format: "esm",
  platform: "node",
  target: "node20",
  minify: false,
  sourcemap: false,
  // Only externalize true Node built-ins
  packages: "bundle", // force ALL npm packages to be bundled
  external: [
    "node:module",
    "node:url",
    "node:path",
    "node:fs",
    "node:os",
    "node:crypto",
    "node:stream",
    "node:util",
    "node:events",
    "node:buffer",
    "node:http",
    "node:https",
    "node:net",
    "node:tls",
    "node:dns",
    "node:child_process",
    "node:querystring",
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.main": "false",
  },
  // This shim fixes "Dynamic require of X is not supported" for CJS packages
  banner: {
    js: [
      `import { createRequire } from 'node:module';`,
      `import { fileURLToPath } from 'node:url';`,
      `import { dirname } from 'node:path';`,
      `const require = createRequire(import.meta.url);`,
      `const __filename = fileURLToPath(import.meta.url);`,
      `const __dirname = dirname(__filename);`,
    ].join("\n"),
  },
});

console.log("✓ API bundle built → api/server-bundle.mjs");