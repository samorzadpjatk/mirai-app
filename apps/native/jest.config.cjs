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
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^@mirai-app/trpc$": "<rootDir>/../../packages/trpc/src",
    "^@mirai-app/trpc/client$": "<rootDir>/../../packages/trpc/src/client",
    "^@mirai-app/trpc/client/query$":
      "<rootDir>/../../packages/trpc/src/client/query",
    "^@mirai-app/supabase$": "<rootDir>/../../packages/supabase/src",
    "^@mirai-app/auth$": "<rootDir>/../../packages/auth/src",
    "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index",
  },

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],

  // Transform configuration - use babel-jest
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },

  // Files to ignore during transformation
  transformIgnorePatterns: [
    "/node_modules/(?!(expo|@expo|react-native|@react-native|@react-navigation|@tanstack)/)",
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
