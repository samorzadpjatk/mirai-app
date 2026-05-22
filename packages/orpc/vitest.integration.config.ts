import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/api/routers/__tests__/**/*.test.ts",
      "src/__tests__/router.test.ts",
      "src/services/__tests__/notificationService.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.setup.ts",
        "**/types.ts",
        "src/index.ts",
        "src/client/index.ts",
        "src/client/query/index.ts",
        "src/api/routers/**/types.ts",
        "src/api/routers/**/index.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 55,
        lines: 78,
        statements: 78,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: "@mirai-app/shared/test-utils",
        replacement: path.resolve(__dirname, "../shared/src/test-utils/index.ts"),
      },
      { find: "@mirai-app/shared", replacement: path.resolve(__dirname, "../shared/index.ts") },
      { find: "@mirai-app/auth", replacement: path.resolve(__dirname, "../auth/src") },
      { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../db/src") },
      { find: "@mirai-app/supabase", replacement: path.resolve(__dirname, "../supabase/src") },
      { find: "~", replacement: path.resolve(__dirname, "./src") },
    ],
  },
});
