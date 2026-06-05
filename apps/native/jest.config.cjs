/**
 * Jest configuration for Expo React Native testing
 *
 * Uses jest-expo preset with overridden transformIgnorePatterns
 * to handle Bun's .bun/ cache directory.
 *
 * @see https://docs.expo.dev/develop/unit-testing/
 */

// NX 22.7.2 + Jest 29/30 conflict causes multiple signal-exit / tmp / graceful-fs
// instances to register process exit listeners, exceeding the default limit of 10.
// See: https://github.com/nrwl/nx/issues/33982
process.setMaxListeners(50);

module.exports = {
  preset: "jest-expo",
  // ESM support for Jest 30+ - only treat source files as ESM
  extensionsToTreatAsEsm: [],
  // Override transformIgnorePatterns to add .bun (Bun's cache directory)
  // The jest-expo preset has: /node_modules/(?!(.pnpm|react-native|...))
  // We add .bun alongside .pnpm
  transformIgnorePatterns: [
    "node_modules/(?!.*(?:.bun|.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|copy-anything|is-what|@orpc)),",
  ],
  // Handle ESM .mjs files from @orpc packages
  transform: {
    "\\.mjs$": "babel-jest",
  },
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^@mirai-app/supabase$": "<rootDir>/../../packages/supabase/src/index.ts",
    "^@mirai-app/auth$": "<rootDir>/../../packages/auth/src/index.ts",
    "^@mirai-app/db$": "<rootDir>/../../packages/db/src/index.ts",
    "^@mirai-app/orpc/client/query$": "<rootDir>/../../packages/orpc/src/client/query/index.ts",
    "^@mirai-app/orpc/client$": "<rootDir>/../../packages/orpc/src/client/index.ts",
    "^@mirai-app/orpc/utils/activityFeed$":
      "<rootDir>/../../packages/orpc/src/utils/activityFeed.ts",
    "^bun$": "<rootDir>/__mocks__/bun.js",
    "^msw/node$": "<rootDir>/../../node_modules/.bun/msw@2.14.6/node_modules/msw/lib/node/index.js",
  },
  testTimeout: 10000,
  clearMocks: true,
  workerIdleMemoryLimit: "512MB",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // Exclude helper files from test discovery
  testPathIgnorePatterns: [
    "/node_modules/",
    "__tests__/helpers/",
    "__tests__/utils/",
    ".*/helpers/.*",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/helpers/**",
    "!src/**/index.ts",
    "!src/types/**",
    "!src/app/**",
    "!src/styles/**",
    "!src/config/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
