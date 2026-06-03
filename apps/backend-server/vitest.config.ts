import { defineConfig, mergeConfig } from "vitest/config";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { baseConfig, baseCoverageExcludes } from "../../packages/shared/vitest.base.config";
import path from "path";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts"],
      coverage: {
        exclude: [...baseCoverageExcludes, "**/__tests__/**"],
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
