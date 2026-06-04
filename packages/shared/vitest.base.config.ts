import { defineConfig } from "vitest/config";

export const baseCoverageExcludes = [
  "node_modules/",
  "dist/",
  "**/*.d.ts",
  "**/*.config.*",
  "**/vitest.setup.ts",
];

export const baseConfig = defineConfig({
  test: {
    globals: true,
    isolate: false,
    deps: {
      optimizer: {
        ssr: {
          enabled: true,
          include: ["drizzle-orm"],
        },
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
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
