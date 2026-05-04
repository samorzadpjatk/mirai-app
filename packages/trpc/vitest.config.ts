import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts"],
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
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@mirai-app/auth": path.resolve(__dirname, "../auth/src"),
      "@mirai-app/db": path.resolve(__dirname, "../db/src"),
      "@mirai-app/supabase": path.resolve(__dirname, "../supabase/src"),
      "@mirai-app/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
});
