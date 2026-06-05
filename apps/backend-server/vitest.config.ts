import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig, baseCoverageExcludes } from "../../packages/shared/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      isolate: false,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts"],
      coverage: {
        exclude: [...baseCoverageExcludes, "**/__tests__/**"],
        thresholds: {
          branches: 55,
          functions: 70,
          lines: 60,
          statements: 60,
        },
      },
    },
    api: {
      allowWrite: false,
      allowExec: false,
    },
    resolve: {
      alias: { "~": path.resolve(__dirname, "./src") },
    },
  }),
);
