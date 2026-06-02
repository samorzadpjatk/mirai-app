import { defineConfig } from "vitest/config";

const baseCoverageExcludes = [
  "node_modules/",
  "dist/",
  "**/*.d.ts",
  "**/*.config.*",
  "**/vitest.setup.ts",
];

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        ...baseCoverageExcludes,
        "**/coverage/**",
        "**/*.test.ts",
        "**/*.config.ts",
        "**/*.config.js",
        "**/eslint.config.*",
        "src/schema/**",
      ],
    },
  },
});
