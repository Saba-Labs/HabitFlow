// vite.config.server.ts
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/index.ts"),  // ← point to index.ts directly
      name: "server",
      fileName: "node-build",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node built-ins ONLY — everything else gets bundled
        /^node:/,
        "fs", "path", "url", "http", "https", "os",
        "crypto", "stream", "util", "events", "buffer",
        "querystring", "child_process",
        // ❌ Do NOT list express, cors, pg, bcryptjs etc here
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
