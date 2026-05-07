import baseConfig from "../../eslint.config.base.js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      // Allow require() in tests for mocking patterns
      "@typescript-eslint/no-require-imports": "off",
      // Allow unused vars in tests (often needed for type inference)
      "@typescript-eslint/no-unused-vars": "off",
      // Allow floating promises in tests (intentional for async state testing)
      "@typescript-eslint/no-floating-promises": "off",
      // Allow async functions without await (for test isolation patterns)
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    ignores: [".expo", "dist", "coverage/**", "jest.setup.js"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    ...tseslint.configs.disableTypeChecked,
  }
);
