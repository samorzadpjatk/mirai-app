import baseConfig from "../../eslint.config.base.js";

export default [
  ...baseConfig,
  {
    ignores: [".expo", "dist"],
  },
];