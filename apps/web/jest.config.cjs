/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  coverageDirectory: "coverage",
  // Use babel-jest to transform JS/TS/TSX files using the project's Babel config
  transform: {
    "^.+\\.[tj]sx?$": ["babel-jest", { configFile: "./babel.config.jest.js" }],
  },
  // Recognize these file extensions so TS/TSX tests are resolved
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  // Ignore node_modules by default (can be adjusted if you need to transform specific packages)
  transformIgnorePatterns: ["/node_modules/"],
  // Use jsdom which is suitable for testing React/Next components
  testEnvironment: "jsdom",
};
