import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.d.ts", "**/*.config.*", "**/vitest.setup.ts"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: [
      { find: "~", replacement: path.resolve(__dirname, "../../packages/orpc/src") },
      { find: "@mirai-app/shared/test-utils", replacement: path.resolve(__dirname, "../../packages/shared/src/test-utils/index.ts") },
      { find: "@mirai-app/shared", replacement: path.resolve(__dirname, "../../packages/shared/index.ts") },
      { find: "@mirai-app/auth", replacement: path.resolve(__dirname, "../../packages/auth/src") },
      { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../../packages/db/src") },
      { find: "@mirai-app/supabase", replacement: path.resolve(__dirname, "../../packages/supabase/src") },
      { find: "@mirai-app/orpc", replacement: path.resolve(__dirname, "../../packages/orpc/src") },
    ],
  },
});
