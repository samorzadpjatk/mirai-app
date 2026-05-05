module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      "babel-preset-expo",
      "nativewind/babel",
      ["@babel/preset-react", { runtime: "automatic" }],
      ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
    ],
    plugins: ["react-native-worklets/plugin"],
  };
};
