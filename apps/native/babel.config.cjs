module.exports = function (api) {
  const isTest = api.env("test");
  api.cache(true);

  return {
    presets: [
      ...(isTest
        ? [["@babel/preset-env", { targets: { node: "current" } }]]
        : []),
      "@babel/preset-typescript",
      ...(isTest ? [["@babel/preset-react", { runtime: "automatic" }]] : []),
    ],
    plugins: [
      "react-native-worklets/plugin",
      // Tamagui Babel plugin for compile-time optimization
      // This enables prop extraction and performance improvements
      [
        "@tamagui/babel-plugin",
        {
          // Path to Tamagui configuration (relative to project root)
          config: "./node_modules/@mirai-app/ui/tamagui.config.ts",
          // Enable component compilation for better performance
          components: ["tamagui"],
          // Disable in development for faster reloads
          disable: false,
          // Enable debug logging (set to true for troubleshooting)
          logTimings: false,
          // Ensure complete extraction of styles
          importsWhitelist: ["constants.js", "colors.js"],
        },
      ],
    ],
  };
};
