import baseConfig from "../../eslint.config.base.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
  baseConfig,
  {
    files: ["packages/adapters/src/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowOverrideWithoutType: true,
        },
      ],
    },
  },
);
