// Inline Babel plugin to remove CSS imports
function removeCssImports() {
  return {
    visitor: {
      ImportDeclaration(path) {
        const { node } = path;
        if (
          node.source &&
          typeof node.source.value === "string" &&
          (node.source.value.endsWith(".css") ||
            node.source.value.includes("mapbox-gl/dist/mapbox-gl.css"))
        ) {
          // Remove CSS imports - CSS will be loaded via CDN for Web
          path.remove();
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === "development",
        },
      ],
      // Remove CSS imports - CSS will be loaded via CDN for Web
      removeCssImports,
      "react-native-reanimated/plugin",
    ],
  };
};
