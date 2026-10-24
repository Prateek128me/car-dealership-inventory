import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "../docs/coverage/frontend",
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.tsx", "src/test-setup.ts", "src/main.tsx"],
    },
  },
});
