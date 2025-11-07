/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  coverageDirectory: "coverage",

  transform: {
    "^.+\\.[tj]sx?$": [
      "babel-jest",
      { configFile: require.resolve("./babel.config.jest.cjs") },
    ],
  },

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },

  transformIgnorePatterns: ["/node_modules/"],

  testEnvironment: "jsdom",
};
