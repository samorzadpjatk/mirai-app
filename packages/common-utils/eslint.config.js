import baseConfig from "../../eslint.config.base.js";

export default [...baseConfig, {
    ignores: [
        "dist/**",
        "node_modules/**",
    ],
}];
