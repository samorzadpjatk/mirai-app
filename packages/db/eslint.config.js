import baseConfig from "../../eslint.config.base.js";

export default [
  ...baseConfig,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "src/prisma/**",
      "seed.ts",
      "vitest.config.ts",
      "vitest.setup.ts",
      "prisma.config.ts",
    ],
  },
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
