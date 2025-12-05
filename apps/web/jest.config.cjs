const baseConfig = require("@integral-2025-app/jest-config");

module.exports = {
  ...baseConfig,
  transformIgnorePatterns: [
    "/node_modules/(?!(@integral-2025-app|superjson|copy-anything|is-what))/",
  ],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^@integral-2025-app/auth$": "<rootDir>/../../packages/auth/src/index.ts",
    "^@integral-2025-app/auth/client$":
      "<rootDir>/../../packages/auth/src/supabaseClient.ts",
    "^@integral-2025-app/common-types$":
      "<rootDir>/../../packages/common-types/src/index.ts",
  },
};
