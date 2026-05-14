import baseConfig from "../../eslint.config.base.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...baseConfig,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "**/*.d.ts",
      "**/*.d.ts.map",
      "**/*.js",
      "vitest.*.ts",
      "**/__tests__/**/*",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
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
);
