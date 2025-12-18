import baseConfig from "../../eslint.config.base.js";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts", "**/*.d.ts.map", "**/*.js"],
  },
  ...baseConfig,
];
