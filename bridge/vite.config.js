import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  root: "src",
  clearScreen: false,
  css: {
    // Plain CSS only — don't inherit root postcss.config.mjs (Tailwind / Next.js).
    postcss: {
      plugins: [],
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    outDir: "../dist",
    emptyOutDir: true,
  },
});
