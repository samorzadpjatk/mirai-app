module.exports = {
  rootDir: __dirname,
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!((@expo|expo|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-webview|react-native-pdf|react-native-worklets|@maplibre|nativewind|react-native-css-interop|tus-js-client)/))",
  ],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index.ts",
    "^@mirai-app/supabase$": "<rootDir>/../../packages/supabase/src/index.ts",
    "^@mirai-app/auth$": "<rootDir>/../../packages/auth/src/index.ts",
    "^@mirai-app/trpc$": "<rootDir>/../../packages/trpc/src/index.ts",
    "^@mirai-app/db$": "<rootDir>/../../packages/db/src/index.ts",
  },
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
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
};
