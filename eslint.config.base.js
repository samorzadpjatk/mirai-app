
import { defineConfig } from "eslint/config";
import tseslint from 'typescript-eslint';

const config = defineConfig({
  files: ["**/*.ts", "**/*.tsx"],
  extends: [
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
    "space-infix-ops": ["error", { int32Hint: false }],
    // Prevent console.log in production code (allow in tests and scripts)
    "no-console": ["warn", { allow: ["error"] }],
  },

  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
export default config; 
