module.exports = function (api) {
  // Use environment-aware caching to prevent stale configs across environments
  api.cache.using(() => process.env.NODE_ENV);

  return {
    presets: [
      ["babel-preset-expo", { unstable_transformImportMeta: true }],
      "nativewind/babel",
      // Handle JSX and Flow (with @flow pragma)
      ["@babel/preset-react", { runtime: "automatic", flow: true }],
      // Strip Flow from ALL .js files regardless of @flow pragma
      ["@babel/preset-flow", { all: true }],
      ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
    ],
    plugins: [
      "react-native-worklets/plugin",
      // Allow Babel to parse Flow syntax even when TypeScript preset is active
      "babel-plugin-syntax-hermes-parser",
    ],
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
