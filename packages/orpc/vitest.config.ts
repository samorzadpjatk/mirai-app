import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig, baseCoverageExcludes } from "../shared/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
      hookTimeout: 60000,
      coverage: {
        thresholds: { functions: 55, lines: 78, statements: 78 },
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
          find: "@mirai-app/shared/test-utils",
          replacement: path.resolve(__dirname, "../shared/src/test-utils/index.ts"),
        },
        {
          find: "@mirai-app/shared/challengeSubmissions",
          replacement: path.resolve(__dirname, "../shared/src/challengeSubmissions/index.ts"),
        },
        {
          find: "@mirai-app/shared/locations",
          replacement: path.resolve(__dirname, "../shared/src/locations/index.ts"),
        },
        {
          find: "@mirai-app/shared/rewards",
          replacement: path.resolve(__dirname, "../shared/src/rewards/index.ts"),
        },
        {
          find: "@mirai-app/shared/coins",
          replacement: path.resolve(__dirname, "../shared/src/coins/index.ts"),
        },
        {
          find: "@mirai-app/shared/challenges",
          replacement: path.resolve(__dirname, "../shared/src/challenges/index.ts"),
        },
        {
          find: "@mirai-app/shared/feed",
          replacement: path.resolve(__dirname, "../shared/src/feed/index.ts"),
        },
        {
          find: "@mirai-app/shared/groups",
          replacement: path.resolve(__dirname, "../shared/src/groups/index.ts"),
        },
        {
          find: "@mirai-app/shared/stores",
          replacement: path.resolve(__dirname, "../shared/src/stores/index.ts"),
        },
        {
          find: "@mirai-app/shared/trips",
          replacement: path.resolve(__dirname, "../shared/src/trips/index.ts"),
        },
        {
          find: "@mirai-app/shared/users",
          replacement: path.resolve(__dirname, "../shared/src/users/index.ts"),
        },
        {
          find: "@mirai-app/shared/storage",
          replacement: path.resolve(__dirname, "../shared/src/storage/index.ts"),
        },
        {
          find: "@mirai-app/shared/utils",
          replacement: path.resolve(__dirname, "../shared/src/utils/index.ts"),
        },
        {
          find: "@mirai-app/shared/tripInfo",
          replacement: path.resolve(__dirname, "../shared/src/tripInfo/index.ts"),
        },
        {
          find: "@mirai-app/shared/notifications",
          replacement: path.resolve(__dirname, "../shared/src/notifications/index.ts"),
        },
        {
          find: "@mirai-app/shared/challengeVote",
          replacement: path.resolve(__dirname, "../shared/src/challengeVote/index.ts"),
        },
        {
          find: "@mirai-app/shared/reports",
          replacement: path.resolve(__dirname, "../shared/src/reports/index.ts"),
        },
        {
          find: "@mirai-app/shared/sponsors",
          replacement: path.resolve(__dirname, "../shared/src/sponsors/index.ts"),
        },
        { find: "@mirai-app/auth", replacement: path.resolve(__dirname, "../auth/src") },
        { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../db/src") },
        {
          find: "@mirai-app/db/test-helper",
          replacement: path.resolve(__dirname, "../db/src/pglite.ts"),
        },
        { find: "@mirai-app/supabase", replacement: path.resolve(__dirname, "../supabase/src") },
        { find: "~", replacement: path.resolve(__dirname, "./src") },
      ],
    },
  }),
);
