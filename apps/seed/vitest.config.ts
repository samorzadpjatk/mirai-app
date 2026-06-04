import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { baseConfig } from "../../packages/shared/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts"],
    },
    resolve: {
      alias: { "~": path.resolve(__dirname, "./src") },
    },
  }),
);
