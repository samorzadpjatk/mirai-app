/**
 * Storybook Configuration
 *
 * Configures Storybook 8.x with React/Vite support for the Tamagui UI library.
 *
 * @see https://storybook.js.org/docs/configure
 */

const path = require("path");

/**
 * Storybook configuration object
 */
const config = {
  /**
   * Story files pattern
   * Looks for .stories files in src directory
   */
  stories: ["../src/**/*.stories.@(ts|tsx|js|jsx|mdx)"],

  /**
   * Storybook addons
   * Essential addons for component documentation and testing
   */
  addons: [
    // Essential addons (controls, actions, viewport, etc.)
    "@storybook/addon-essentials",
    // Interaction testing
    "@storybook/addon-interactions",
  ],

  /**
   * Framework configuration
   * Using React with Vite builder for fast HMR
   */
  framework: {
    name: "@storybook/react-vite",
    options: {
      // Strict mode for React 19 compatibility
      strictMode: true,
    },
  },

  /**
   * Core configuration
   */
  core: {
    // Disable telemetry
    disableTelemetry: true,
  },

  /**
   * TypeScript configuration
   */
  typescript: {
    // React-docgen for prop table generation
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      // Include all component props
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out native HTML props to reduce noise
        if (prop.parent) {
          return !/node_modules/.test(prop.parent.fileName);
        }
        return true;
      },
    },
  },

  /**
   * Vite configuration
   * Configures Vite for Tamagui compatibility
   */
  viteFinal: async (config) => {
    // Ensure react-native resolves to react-native-web for Storybook
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "react-native": "react-native-web",
      },
      dedupe: ["react", "react-dom", "react-native-web"],
    };

    // Optimize dependencies for Tamagui
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include || []),
        "tamagui",
        "@tamagui/core",
        "@tamagui/config",
        "@tamagui/web",
        "react-native-web",
      ],
    };

    // Add Tamagui Vite plugin for proper token resolution
    const { tamaguiPlugin, tamaguiExtractPlugin } =
      await import("@tamagui/vite-plugin");

    // Add Tamagui plugins
    config.plugins = [
      ...(config.plugins || []),
      tamaguiPlugin({
        config: path.join(__dirname, "..", "tamagui.config.ts"),
        components: ["tamagui"],
      }),
      // CSS extraction in production builds only
      process.env.NODE_ENV === "production" ? tamaguiExtractPlugin() : null,
    ].filter(Boolean);

    return config;
  },

  /**
   * Preview head customization
   */
  previewHead: (head) => `
    ${head}
    <!-- Tamagui CSS will be injected via preview-head.html -->
  `,
};

module.exports = config;
