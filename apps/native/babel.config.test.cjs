module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxRuntime: "automatic" }],
      ["@babel/preset-react", { runtime: "automatic" }],
      ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
    ],
    plugins: [],
  };
};
