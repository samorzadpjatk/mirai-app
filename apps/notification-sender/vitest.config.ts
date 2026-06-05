import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "../../packages/shared/vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      isolate: false,
      include: ["src/**/__tests__/**/*.test.ts"],
      testTimeout: 10000,
    },
    resolve: {
      alias: [
        { find: "~", replacement: path.resolve(__dirname, "../../packages/orpc/src") },
        {
          find: "@mirai-app/shared/test-utils",
          replacement: path.resolve(__dirname, "../../packages/shared/src/test-utils/index.ts"),
        },
        {
          find: "@mirai-app/shared/challenges",
          replacement: path.resolve(__dirname, "../../packages/shared/src/challenges/index.ts"),
        },
        {
          find: "@mirai-app/shared/feed",
          replacement: path.resolve(__dirname, "../../packages/shared/src/feed/index.ts"),
        },
        {
          find: "@mirai-app/shared/groups",
          replacement: path.resolve(__dirname, "../../packages/shared/src/groups/index.ts"),
        },
        {
          find: "@mirai-app/shared/stores",
          replacement: path.resolve(__dirname, "../../packages/shared/src/stores/index.ts"),
        },
        {
          find: "@mirai-app/shared/trips",
          replacement: path.resolve(__dirname, "../../packages/shared/src/trips/index.ts"),
        },
        {
          find: "@mirai-app/shared/users",
          replacement: path.resolve(__dirname, "../../packages/shared/src/users/index.ts"),
        },
        {
          find: "@mirai-app/shared/storage",
          replacement: path.resolve(__dirname, "../../packages/shared/src/storage/index.ts"),
        },
        {
          find: "@mirai-app/shared/utils",
          replacement: path.resolve(__dirname, "../../packages/shared/src/utils/index.ts"),
        },
        {
          find: "@mirai-app/shared/utils/location",
          replacement: path.resolve(__dirname, "../../packages/shared/src/utils/location.ts"),
        },
        {
          find: "@mirai-app/shared/tripInfo",
          replacement: path.resolve(__dirname, "../../packages/shared/src/tripInfo/index.ts"),
        },
        {
          find: "@mirai-app/shared/rewards",
          replacement: path.resolve(__dirname, "../../packages/shared/src/rewards/index.ts"),
        },
        {
          find: "@mirai-app/shared/coins",
          replacement: path.resolve(__dirname, "../../packages/shared/src/coins/index.ts"),
        },
        {
          find: "@mirai-app/shared/challengeSubmissions",
          replacement: path.resolve(
            __dirname,
            "../../packages/shared/src/challengeSubmissions/index.ts",
          ),
        },
        {
          find: "@mirai-app/shared/locations",
          replacement: path.resolve(__dirname, "../../packages/shared/src/locations/index.ts"),
        },
        {
          find: "@mirai-app/shared/notifications",
          replacement: path.resolve(__dirname, "../../packages/shared/src/notifications/index.ts"),
        },
        {
          find: "@mirai-app/auth",
          replacement: path.resolve(__dirname, "../../packages/auth/src"),
        },
        { find: "@mirai-app/db", replacement: path.resolve(__dirname, "../../packages/db/src") },
        {
          find: "@mirai-app/supabase",
          replacement: path.resolve(__dirname, "../../packages/supabase/src"),
        },
        {
          find: "@mirai-app/orpc",
          replacement: path.resolve(__dirname, "../../packages/orpc/src"),
        },
      ],
    },
  }),
);
