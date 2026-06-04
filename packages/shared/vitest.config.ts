import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig, baseCoverageExcludes } from "./vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      isolate: false,
      include: ["src/**/__tests__/**/*.test.ts"],
      coverage: {
        exclude: [...baseCoverageExcludes, "src/test-utils/**"],
      },
    },
    resolve: {
      alias: { "~": path.resolve(__dirname, "./src") },
    },
  }),
);
