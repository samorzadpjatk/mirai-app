/** @type {import('jest').Config} */
module.exports = {
  // Use Node test environment for hook testing
  testEnvironment: "node",

  // Root directories for test discovery
  roots: ["<rootDir>/src"],

  // Test file patterns
  testMatch: ["**/__tests__/**/*.test.ts"],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Module name mapper for path aliases (~/* maps to src/*)
  // Note: Jest doesn't support package.json exports, so we map subpaths explicitly
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    // Mock superjson to avoid ESM issues
    "^superjson$": "<rootDir>/__mocks__/superjson.ts",
    // Frameworks package subpaths
    "^@mirai-app/frameworks$":
      "<rootDir>/../../packages/frameworks/src/index.ts",
    "^@mirai-app/frameworks/supabase$":
      "<rootDir>/../../packages/frameworks/src/supabase/index.ts",
    "^@mirai-app/frameworks/supabase/(.*)$":
      "<rootDir>/../../packages/frameworks/src/supabase/$1",
    "^@mirai-app/frameworks/prisma$":
      "<rootDir>/../../packages/frameworks/src/prisma/index.ts",
    "^@mirai-app/frameworks/prisma/(.*)$":
      "<rootDir>/../../packages/frameworks/src/prisma/$1",
    "^@mirai-app/frameworks/trpc/(.*)$":
      "<rootDir>/../../packages/frameworks/src/trpc/$1",
    "^@mirai-app/frameworks/auth$":
      "<rootDir>/../../packages/frameworks/src/auth/index.ts",
    "^@mirai-app/frameworks/auth/(.*)$":
      "<rootDir>/../../packages/frameworks/src/auth/$1",
    "^@mirai-app/frameworks/stores$":
      "<rootDir>/../../packages/frameworks/src/stores/index.ts",
    "^@mirai-app/frameworks/stores/(.*)$":
      "<rootDir>/../../packages/frameworks/src/stores/$1",
    "^@mirai-app/frameworks/storage$":
      "<rootDir>/../../packages/frameworks/src/storage/index.ts",
    "^@mirai-app/frameworks/di$":
      "<rootDir>/../../packages/frameworks/src/di/index.ts",
    // Fix internal relative imports in frameworks package
    "^../../stores/authStore$":
      "<rootDir>/../../packages/frameworks/src/stores/authStore.ts",
    // Other packages
    "^@mirai-app/adapters$": "<rootDir>/../../packages/adapters/src/index.ts",
    "^@mirai-app/adapters/(.*)$": "<rootDir>/../../packages/adapters/src/$1",
    "^@mirai-app/domain$": "<rootDir>/../../packages/domain/src/index.ts",
    "^@mirai-app/domain/(.*)$": "<rootDir>/../../packages/domain/src/$1",
    "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index.ts",
    "^@mirai-app/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
    "^@mirai-app/test-utils$":
      "<rootDir>/../../packages/adapters/src/test-utils/index.ts",
    "^@mirai-app/use-cases$": "<rootDir>/../../packages/use-cases/src/index.ts",
    "^@mirai-app/use-cases/(.*)$": "<rootDir>/../../packages/use-cases/src/$1",
  },

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],

  // Transform configuration - use babel-jest
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },

  // Files to ignore during transformation
  // NOTE: superjson and react-native must be transformed as they use ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(expo|@expo|react-native|@react-native|@react-navigation|@tanstack|superjson|zustand)/)",
  ],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**/*.{ts,tsx}",
    "!src/components/**/*.{ts,tsx}",
    "!src/styles/**/*.{ts,tsx}",
    "!src/types/**/*.{ts,tsx}",
    "!src/**/index.ts",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "text-summary", "lcov", "html"],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Module directories for resolution
  moduleDirectories: ["node_modules", "<rootDir>/../../node_modules"],

  // Cache directory for Jest
  cacheDirectory: ".jest-cache",

  // Ignore patterns for test file search
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "/dist/", "/.turbo/"],

  // Watch plugins for interactive mode
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
};
