import path from "path";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "../../packages/common/vitest.base.config";

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
          find: "@mirai-app/common/test-utils",
          replacement: path.resolve(__dirname, "../../packages/common/src/test-utils/index.ts"),
        },
        {
          find: "@mirai-app/common/challenges",
          replacement: path.resolve(__dirname, "../../packages/common/src/challenges/index.ts"),
        },
        {
          find: "@mirai-app/common/feed",
          replacement: path.resolve(__dirname, "../../packages/common/src/feed/index.ts"),
        },
        {
          find: "@mirai-app/common/groups",
          replacement: path.resolve(__dirname, "../../packages/common/src/groups/index.ts"),
        },
        {
          find: "@mirai-app/common/stores",
          replacement: path.resolve(__dirname, "../../packages/common/src/stores/index.ts"),
        },
        {
          find: "@mirai-app/common/trips",
          replacement: path.resolve(__dirname, "../../packages/common/src/trips/index.ts"),
        },
        {
          find: "@mirai-app/common/users",
          replacement: path.resolve(__dirname, "../../packages/common/src/users/index.ts"),
        },
        {
          find: "@mirai-app/common/storage",
          replacement: path.resolve(__dirname, "../../packages/common/src/storage/index.ts"),
        },
        {
          find: "@mirai-app/common/utils",
          replacement: path.resolve(__dirname, "../../packages/common/src/utils/index.ts"),
        },
        {
          find: "@mirai-app/common/utils/location",
          replacement: path.resolve(__dirname, "../../packages/common/src/utils/location.ts"),
        },
        {
          find: "@mirai-app/common/tripInfo",
          replacement: path.resolve(__dirname, "../../packages/common/src/tripInfo/index.ts"),
        },
        {
          find: "@mirai-app/common/rewards",
          replacement: path.resolve(__dirname, "../../packages/common/src/rewards/index.ts"),
        },
        {
          find: "@mirai-app/common/coins",
          replacement: path.resolve(__dirname, "../../packages/common/src/coins/index.ts"),
        },
        {
          find: "@mirai-app/common/challengeSubmissions",
          replacement: path.resolve(
            __dirname,
            "../../packages/common/src/challengeSubmissions/index.ts",
          ),
        },
        {
          find: "@mirai-app/common/locations",
          replacement: path.resolve(__dirname, "../../packages/common/src/locations/index.ts"),
        },
        {
          find: "@mirai-app/common/notifications",
          replacement: path.resolve(__dirname, "../../packages/common/src/notifications/index.ts"),
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
