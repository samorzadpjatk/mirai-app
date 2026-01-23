module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
