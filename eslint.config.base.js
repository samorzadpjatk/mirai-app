import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const config = defineConfig({
  files: ["**/*.ts", "**/*.tsx"],
  extends: [
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
    "space-infix-ops": ["error", { int32Hint: false }],
    // Allow this aliasing for Effect.gen pattern where 'this' is shadowed with local variables like 'db'
    "@typescript-eslint/no-this-alias": "off",
    "no-console": ["warn", { allow: ["error"] }],
    // Disable - we follow inference-first pattern; explicit types only needed for error composition
    "@typescript-eslint/explicit-function-return-type": "off",
  },

  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
});
export default config;
