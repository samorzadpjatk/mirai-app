/**
 * Tamagui Build Configuration
 *
 * Build options file for Tamagui-specific settings.
 * Used by both Vite and Metro bundlers.
 *
 * @see https://tamagui.dev/docs/guides/design-systems
 */

/**
 * Tamagui build options interface
 */
interface TamaguiBuildOptions {
  /** Components to scan for Tamagui optimization */
  components: string[];
  /** Config file path (relative to this file) */
  config: string;
  /** Output directory for generated files */
  outputDir: string;
  /** Enable CSS extraction in production */
  extractCSS: boolean;
  /** Enable the Tamagui compiler for performance */
  disableExtraction: boolean;
  /** Enable debug logging */
  debug: boolean;
  /** Platform target: 'web' for browser/Vite, 'native' for Metro */
  platform: "web" | "native";
  /** Import paths to resolve */
  resolveImports: boolean;
}

/**
 * Tamagui build options
 * Configures how Tamagui processes and optimizes the UI library
 */
export const tamaguiBuildOptions: TamaguiBuildOptions = {
  // Components to scan for Tamagui optimization
  components: ["tamagui"],

  // Config file path (relative to this file)
  config: "./tamagui.config.ts",

  // Output directory for generated files
  outputDir: "./dist",

  // Enable CSS extraction in production
  // This generates a separate CSS file with all Tamagui styles
  extractCSS: process.env.NODE_ENV === "production",

  // Enable the Tamagui compiler for performance
  // Note: Disabled during initial migration, enable in Phase 4
  disableExtraction: true,

  // Enable debug logging
  debug: false,

  // Platform target
  // 'web' for browser/Vite builds, 'native' for Metro builds
  platform: "web",

  // Import paths to resolve
  // Ensures proper resolution of react-native vs react-native-web
  resolveImports: true,
};

/**
 * Metro-specific build options
 * Used by @tamagui/metro-plugin for React Native builds
 */
export const metroBuildOptions: Partial<TamaguiBuildOptions> = {
  ...tamaguiBuildOptions,
  platform: "native",
  // Metro handles its own CSS extraction
  extractCSS: false,
};

/**
 * Default export for convenience
 */
export default tamaguiBuildOptions;
