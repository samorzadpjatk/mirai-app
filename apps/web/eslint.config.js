import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "../../eslint.config.base.js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...baseConfig,
  {
    ignores: [".next"],
  },
  ...compat.extends("next/core-web-vitals"),
];