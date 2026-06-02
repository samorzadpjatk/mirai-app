import { defineConfig, mergeConfig } from "vitest/config";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { baseConfig } from "../shared/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/__tests__/**/*.sqlite.test.ts"],
    },
    ssr: {
      external: ["bun:sqlite"],
      noExternal: ["zod"],
    },
  }),
);
