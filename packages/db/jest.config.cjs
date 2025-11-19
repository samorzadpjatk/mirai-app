/** @type {import('jest').Config} */
module.exports = {
  ...require("@integral-2025-app/jest-config"),
  displayName: "db",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(server-only)/)",
  ],
};
