import baseConfig from "../../eslint.config.base.js";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...baseConfig,
];
