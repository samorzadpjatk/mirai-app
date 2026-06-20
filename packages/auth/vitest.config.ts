import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig, baseCoverageExcludes } from "../common/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      hookTimeout: 30000,
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
          find: "@mirai-app/common/test-utils",
          replacement: path.resolve(__dirname, "../common/src/test-utils/index.ts"),
        },
        {
          find: "@mirai-app/common/stores",
          replacement: path.resolve(__dirname, "../common/src/stores/index.ts"),
        },
        {
          find: "@mirai-app/common/users",
          replacement: path.resolve(__dirname, "../common/src/users/index.ts"),
        },
        {
          find: "@mirai-app/common/utils",
          replacement: path.resolve(__dirname, "../common/src/utils/index.ts"),
        },
        {
          find: "@mirai-app/db/test-helper",
          replacement: path.resolve(__dirname, "../db/src/pglite.ts"),
        },
        { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../db/src") },
        { find: "@mirai-app/supabase", replacement: path.resolve(__dirname, "../supabase/src") },
        { find: "~", replacement: path.resolve(__dirname, "./src") },
      ],
    },
  }),
);
