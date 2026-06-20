import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "../../packages/common/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts"],
      coverage: {
        exclude: ["src/utils/fs.ts"],
      },
    },
    resolve: {
      alias: { "~": path.resolve(__dirname, "./src") },
    },
  }),
);
