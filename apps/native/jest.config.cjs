/**
 * Jest configuration for Expo React Native testing
 * 
 * This configuration follows Expo's testing documentation guidelines:
 * - Uses transformIgnorePatterns that allow transpiling Expo and React Native packages
 * - Configured for TypeScript and React Native Testing Library
 * - Includes setup for monorepo workspace aliases
 * 
 * Note: Using manual config instead of jest-expo preset due to ES module compatibility
 * with the project's "type": "module" configuration. The transformIgnorePatterns
 * follow the official Expo documentation recommendations.
 * 
 * @see https://docs.expo.dev/develop/unit-testing/
 */
module.exports = {
  rootDir: __dirname,
  testEnvironment: "node",
  // Expo-recommended transformIgnorePatterns
  // Allows transpiling of react-native, expo, and related packages
  // @see https://docs.expo.dev/develop/unit-testing/#configuration
  transformIgnorePatterns: [
    "node_modules/(?!((@expo|expo|expo-modules-core|expo-location|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-webview|react-native-pdf|react-native-worklets|@maplibre|nativewind|react-native-css-interop|tus-js-client|superjson)/))",
  ],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index.ts",
    "^@mirai-app/supabase$": "<rootDir>/../../packages/supabase/src/index.ts",
    "^@mirai-app/auth$": "<rootDir>/../../packages/auth/src/index.ts",
    "^@mirai-app/db$": "<rootDir>/../../packages/db/src/index.ts",
    "\\.(png|jpg|jpeg|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "^expo/virtual/env$": "<rootDir>/__mocks__/expo-virtual-env.js",
  },
  setupFiles: ["<rootDir>/jest.setup.console.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts?(x)"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/../../",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { configFile: "./babel.config.test.cjs" }],
  },
};
