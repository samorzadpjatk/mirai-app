import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";

const config = defineConfig(
  {
    ignores: [".expo", "dist", "coverage/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "testing-library": testingLibrary,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...testingLibrary.configs["flat/react"].rules,
    },
  },
);

export default config;
