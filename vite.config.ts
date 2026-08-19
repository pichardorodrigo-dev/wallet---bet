import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api al backend en desarrollo para evitar problemas de CORS y no
// tener que hardcodear la URL del backend en el codigo del frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
