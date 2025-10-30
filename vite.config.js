"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
exports.default = (0, vite_1.defineConfig)(function (_a) {
    var mode = _a.mode;
    var env = (0, vite_1.loadEnv)(mode, ".", "");
    return {
        server: {
            port: 3000,
            host: "0.0.0.0",
        },
        plugins: [(0, plugin_react_1.default)()],
        define: {
            "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
            "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
        },
        resolve: {
            alias: {
                "@": path_1.default.resolve(__dirname, "src"),
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
