// Standalone, non-SSR Vite build used ONLY to produce a fully static, client-only
// bundle for the Capacitor/Android WebView (no server, no Nitro, no TanStack Start
// SSR plumbing). Entry point: capacitor-entry.html -> src/entry-capacitor.tsx.
//
// Run with: bunx vite build --config vite.capacitor.config.ts
// Output: capacitor-www/ (renamed from capacitor-entry.html to index.html afterwards)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths({ projects: ["./tsconfig.json"] }), react()],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
  },
  css: { transformer: "lightningcss" },
  build: {
    outDir: "capacitor-www",
    emptyOutDir: true,
    rollupOptions: {
      input: "capacitor-entry.html",
    },
  },
});
