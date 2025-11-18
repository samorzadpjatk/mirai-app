import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "../../eslint.config.base.js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  ...baseConfig,
  {
    ignores: [".next", "public/**/*", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;