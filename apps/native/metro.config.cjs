// Check if required modules are resolvable.
// Tools like knip may not resolve workspace dependencies when loading config files.
let hasExpo, hasNativeWind;
try {
  require.resolve("expo");
  hasExpo = true;
} catch {
  hasExpo = false;
}
try {
  require.resolve("nativewind/metro");
  hasNativeWind = true;
} catch {
  hasNativeWind = false;
}

let moduleExports = {};

if (hasExpo && hasNativeWind) {
  try {
    const { getDefaultConfig } = require("expo/metro-config");
    const { withNativeWind } = require("nativewind/metro");
    const config = getDefaultConfig(__dirname);
    moduleExports = withNativeWind(config, {
      input: "./src/global.css",
      configPath: require.resolve("./tailwind.config.cjs"),
      inlineRem: 16,
    });
  } catch {
    // Fallback when workspace dependencies can't be fully resolved
    // (e.g. static analysis tools running outside the package context)
    moduleExports = {};
  }
}

module.exports = moduleExports;
