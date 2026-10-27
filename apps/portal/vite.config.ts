import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4100,
    proxy: {
      "/nowork": {
        target: "http://localhost:4101",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nowork/, ""),
      },
      "/gomoku": {
        target: "http://localhost:4102",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gomoku/, ""),
      },
      "/junqi": {
        target: "http://localhost:4103",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/junqi/, ""),
      },
      "/cube": {
        target: "http://localhost:4104",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cube/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
