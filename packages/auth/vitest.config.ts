import { defineConfig, mergeConfig } from "vitest/config";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { baseConfig, baseCoverageExcludes } from "../shared/vitest.base.config";
import path from "path";

export default mergeConfig(baseConfig, defineConfig({
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
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@mirai-app/db": path.resolve(__dirname, "../db/src"),
      "@mirai-app/supabase": path.resolve(__dirname, "../supabase/src"),
      "@mirai-app/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
}));
