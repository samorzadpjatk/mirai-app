import baseConfig from "../../eslint.config.base.js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...baseConfig,
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
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  // Reanimated files use mutable shared values via .value assignments
  // This is the intended Reanimated API and cannot be avoided
  {
    files: ["**/stores/map/mapOverlayStore.ts", "**/components/judgement/CardStack.tsx"],
    rules: {
      "react-hooks/immutability": "off",
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
      // Allow empty functions in tests (for mocks/stubs)
      "@typescript-eslint/no-empty-function": "off",
      // Allow unsafe assignments in tests (mocking flexibility)
      "@typescript-eslint/no-unsafe-assignment": "off",
      // Allow unsafe calls in tests
      "@typescript-eslint/no-unsafe-call": "off",
      // Allow unsafe member access in tests
      "@typescript-eslint/no-unsafe-member-access": "off",
      // Allow unsafe returns in tests
      "@typescript-eslint/no-unsafe-return": "off",
      // Allow unsafe arguments in tests
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    ignores: [".expo", "dist", "coverage/**", "jest.setup.js"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    ...tseslint.configs.disableTypeChecked,
  },
);
