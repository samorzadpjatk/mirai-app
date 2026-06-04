import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";

const baseCoverageExcludes = [
  "node_modules/",
  "dist/",
  "**/*.d.ts",
  "**/*.config.*",
  "**/vitest.setup.ts",
];

const baseConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: baseCoverageExcludes,
    },
  },
});

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    },
    resolve: {
      alias: { "~": path.resolve(__dirname, "./src") },
    },
  }),
);
