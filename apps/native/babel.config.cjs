module.exports = function (api) {
  const isTest = api.env("test");
  api.cache(true);

  return {
    presets: [
      ...(isTest
        ? [["@babel/preset-env", { targets: { node: "current" } }]]
        : []),
      "@babel/preset-typescript",
      ...(isTest
        ? [["@babel/preset-react", { runtime: "automatic" }]]
        : ["nativewind/babel"]),
    ],
    plugins: ["react-native-worklets/plugin"],
  };
};
