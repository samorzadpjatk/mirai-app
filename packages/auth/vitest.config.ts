import { defineConfig, mergeConfig } from "vitest/config";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { baseConfig, baseCoverageExcludes } from "../shared/vitest.base.config";
import path from "path";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts"],
      coverage: {
        exclude: [
          ...baseCoverageExcludes,
          "src/types.ts",
          "src/store/index.ts",
          "src/hooks/useLoginForm.ts",
          "src/store/AuthStoreProvider.tsx",
          "src/index.ts",
        ],
      },
    },
    resolve: {
      alias: [
        {
          find: "@mirai-app/shared/test-utils",
          replacement: path.resolve(__dirname, "../shared/src/test-utils/index.ts"),
        },
        { find: "@mirai-app/shared", replacement: path.resolve(__dirname, "../shared/index.ts") },
        { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../db/src") },
        { find: "@mirai-app/supabase", replacement: path.resolve(__dirname, "../supabase/src") },
        { find: "~", replacement: path.resolve(__dirname, "./src") },
      ],
    },
  }),
);
