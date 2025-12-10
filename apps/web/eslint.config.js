import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "../../eslint.config.base.js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  ...baseConfig,
  {
    ignores: [".next", "public/**/*", "next-env.d.ts", "coverage/**"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
  {
    files: [
      "prisma/**/*.ts",
      "src/server/**/*.ts",
      "src/app/sw.ts",
      "next-env.d.ts",
      "postcss.config.js",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
