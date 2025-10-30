import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        external: ["@google/genai"],
        output: {
          globals: {
            "@google/genai": "google.generativeai",
          },
          format: "es",
        },
      },
      target: "esnext",
      sourcemap: true,
    },
    optimizeDeps: {
      include: ["@emotion/react", "@emotion/styled", "@mui/material"],
    },
  };
});
