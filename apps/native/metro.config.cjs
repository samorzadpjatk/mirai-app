const { getDefaultConfig } = require("expo/metro-config");

// Get default Expo Metro config
const config = getDefaultConfig(__dirname);

// Configure Tamagui Metro plugin for native bundling
// This enables proper Tamagui component compilation and optimization for React Native
const { withTamagui } = require("@tamagui/metro-plugin");

module.exports = withTamagui(config, {
  // Enable Tamagui's CSS extraction for native
  // This allows Tamagui's CSS-like styling to work on mobile
  components: ["tamagui"],
  // Path to Tamagui configuration (relative to project root)
  config: "./node_modules/@mirai-app/ui/tamagui.config.ts",
  // Output path for compiled CSS (used during build)
  outputCSS: "./.tamagui/tamagui-native.css",
});
