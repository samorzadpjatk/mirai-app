import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig, baseCoverageExcludes } from "../common/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
      hookTimeout: 60000,
      coverage: {
        thresholds: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        exclude: [
          ...baseCoverageExcludes,
          "src/index.ts",
          "src/client/index.ts",
          "src/client/query/index.ts",
          "src/api/routers/**/types.ts",
          "src/api/routers/**/index.ts",
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
          find: "@mirai-app/common/challengeSubmissions",
          replacement: path.resolve(__dirname, "../common/src/challengeSubmissions/index.ts"),
        },
        {
          find: "@mirai-app/common/locations",
          replacement: path.resolve(__dirname, "../common/src/locations/index.ts"),
        },
        {
          find: "@mirai-app/common/rewards",
          replacement: path.resolve(__dirname, "../common/src/rewards/index.ts"),
        },
        {
          find: "@mirai-app/common/coins",
          replacement: path.resolve(__dirname, "../common/src/coins/index.ts"),
        },
        {
          find: "@mirai-app/common/challenges",
          replacement: path.resolve(__dirname, "../common/src/challenges/index.ts"),
        },
        {
          find: "@mirai-app/common/feed",
          replacement: path.resolve(__dirname, "../common/src/feed/index.ts"),
        },
        {
          find: "@mirai-app/common/groups",
          replacement: path.resolve(__dirname, "../common/src/groups/index.ts"),
        },
        {
          find: "@mirai-app/common/stores",
          replacement: path.resolve(__dirname, "../common/src/stores/index.ts"),
        },
        {
          find: "@mirai-app/common/trips",
          replacement: path.resolve(__dirname, "../common/src/trips/index.ts"),
        },
        {
          find: "@mirai-app/common/users",
          replacement: path.resolve(__dirname, "../common/src/users/index.ts"),
        },
        {
          find: "@mirai-app/common/storage",
          replacement: path.resolve(__dirname, "../common/src/storage/index.ts"),
        },
        {
          find: "@mirai-app/common/utils",
          replacement: path.resolve(__dirname, "../common/src/utils/index.ts"),
        },
        {
          find: "@mirai-app/common/tripInfo",
          replacement: path.resolve(__dirname, "../common/src/tripInfo/index.ts"),
        },
        {
          find: "@mirai-app/common/notifications",
          replacement: path.resolve(__dirname, "../common/src/notifications/index.ts"),
        },
        {
          find: "@mirai-app/common/challengeVote",
          replacement: path.resolve(__dirname, "../common/src/challengeVote/index.ts"),
        },
        {
          find: "@mirai-app/common/reports",
          replacement: path.resolve(__dirname, "../common/src/reports/index.ts"),
        },
        {
          find: "@mirai-app/common/sponsors",
          replacement: path.resolve(__dirname, "../common/src/sponsors/index.ts"),
        },
        { find: "@mirai-app/auth", replacement: path.resolve(__dirname, "../auth/src") },
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
