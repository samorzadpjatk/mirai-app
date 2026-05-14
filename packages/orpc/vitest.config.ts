import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.setup.ts",
      ],
      thresholds: {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: [
      { find: "@mirai-app/shared/test-utils", replacement: path.resolve(__dirname, "../shared/src/test-utils/index.ts") },
      { find: "@mirai-app/shared", replacement: path.resolve(__dirname, "../shared/index.ts") },
      { find: "@mirai-app/auth", replacement: path.resolve(__dirname, "../auth/src") },
      { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../db/src") },
      { find: "@mirai-app/supabase", replacement: path.resolve(__dirname, "../supabase/src") },
      { find: "~", replacement: path.resolve(__dirname, "./src") },
    ],
  },
});
