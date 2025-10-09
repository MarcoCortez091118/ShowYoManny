import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Evita el .map corrupto de react-query durante el prebundle
  optimizeDeps: {
    exclude: ["@tanstack/react-query"],
  },
  build: { sourcemap: false },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});
