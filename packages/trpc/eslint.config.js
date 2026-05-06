import baseConfig from "../../eslint.config.base.js";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "vitest.*.ts"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./packages/trpc/tsconfig.eslint.json",
        tsconfigRootDir: "/Users/rafalopilowski/Projekty/migration/pjapp",
      },
    },
    rules: {
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/require-await": "error",
    },
  },
];
