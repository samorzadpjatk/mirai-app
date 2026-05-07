module.exports = function (api) {
  // Use environment-aware caching to prevent stale configs across environments
  api.cache.using(() => process.env.NODE_ENV);

  return {
    presets: [
      "babel-preset-expo",
      "nativewind/babel",
      // Enable Flow support for React Native source files
      ["@babel/preset-react", { runtime: "automatic", flow: true }],
      ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
    ],
    plugins: ["react-native-worklets/plugin"],
    env: {
      test: {
        plugins: [
          // Ensure modules are transformed to CommonJS for Jest
          ["@babel/plugin-transform-modules-commonjs", { lazy: false }],
        ],
      },
    },
  };
};
