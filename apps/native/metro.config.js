const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// NativeWind configuration
module.exports = withNativeWind(config, { 
  input: "./src/global.css",
  inlineRem: 16,
});
