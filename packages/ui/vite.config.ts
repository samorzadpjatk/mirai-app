/**
 * Vite configuration for @mirai-app/ui
 *
 * Generates three output formats:
 * - ESM (.mjs) for modern bundlers (Vite, Webpack 5+)
 * - CJS (.js) for Node.js and older bundlers
 * - JSX (preserved) for Metro/React Native
 *
 * @see https://tamagui.dev/docs/guides/design-systems
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tamaguiExtractPlugin, tamaguiPlugin } from "@tamagui/vite-plugin";
import * as path from "path";

// Entry points for the library
const entries = {
  index: path.resolve(__dirname, "src/index.ts"),
  "tamagui.config": path.resolve(__dirname, "tamagui.config.ts"),
};

// External dependencies (peer deps and Tamagui packages)
const externalDeps = [
  "react",
  "react-dom",
  "react-native",
  "react-native-web",
  "tamagui",
  "@tamagui/core",
  "@tamagui/config",
  "@tamagui/web",
  "@tamagui/vite-plugin",
  "@tamagui/metro-plugin",
];

/**
 * Base configuration shared across all builds
 */
const baseConfig = {
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    // Tamagui plugin for proper token resolution
    tamaguiPlugin({
      config: "./tamagui.config.ts",
      components: ["tamagui"],
    }),
    // Tamagui CSS extraction (disabled in dev mode for faster builds)
    process.env.NODE_ENV === "production" ? tamaguiExtractPlugin() : null,
  ].filter(Boolean),

  resolve: {
    alias: {
      // Ensure React Native resolves to react-native-web on web builds
      "react-native": "react-native-web",
    },
    dedupe: ["react", "react-dom", "react-native-web"],
  },

  // Optimizations for monorepo development
  optimizeDeps: {
    include: ["tamagui", "@tamagui/core", "@tamagui/config"],
    exclude: ["react-native"],
  },

  // CSS handling for Tamagui
  css: {
    modules: {
      localsConvention: "camelCase" as const,
    },
  },
};

/**
 * ESM/CJS Build Configuration
 * Standard library build for web bundlers
 */
const esmCjsConfig = defineConfig({
  ...baseConfig,

  build: {
    target: "esnext",
    minify: false,
    sourcemap: true,
    lib: {
      entry: entries,
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "mjs" : "js";
        return `${format === "es" ? "esm" : "cjs"}/${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: externalDeps,
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        interop: "auto",
        exports: "named",
      },
    },
    outDir: "dist",
    emptyOutDir: false, // Don't empty, JSX build will add to it
  },
});

/**
 * JSX Build Configuration
 * Preserves JSX syntax for Metro/React Native bundler
 *
 * This build:
 * - Preserves JSX syntax (does not transform to React.createElement)
 * - Transpiles TypeScript to JavaScript
 * - Maintains ES module structure for tree-shaking
 * - Outputs .jsx files for Metro compatibility
 */
const jsxConfig = defineConfig({
  ...baseConfig,

  esbuild: {
    // Preserve JSX syntax - don't transform to React.createElement
    jsx: "preserve",
    // Use automatic JSX runtime (Metro will handle the rest)
    jsxImportSource: "react",
    // Target modern ES for Metro
    target: "esnext",
  },

  build: {
    target: "esnext",
    minify: false,
    sourcemap: true,

    // Library mode configuration
    lib: {
      entry: entries,
      // Use ESM format - JSX is preserved at the esbuild level
      formats: ["es"],
      fileName: (_format, entryName) => {
        // Output .jsx extension for Metro compatibility
        return `jsx/${entryName}.jsx`;
      },
    },

    rollupOptions: {
      external: externalDeps,
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        interop: "auto",
        exports: "named",
        // Ensure proper file extensions in imports
        entryFileNames: (chunkInfo) => {
          // Replace .ts/.tsx with .jsx
          const name = chunkInfo.name.replace(/\.tsx?$/, "");
          return `jsx/${name}.jsx`;
        },
        chunkFileNames: "jsx/[name].jsx",
      },
    },

    outDir: "dist",
    emptyOutDir: false, // Don't empty, ESM/CJS already built there
  },
});

/**
 * Export configuration based on build target
 *
 * Modes:
 * - "jsx": Build JSX output only
 * - Default: Build ESM/CJS
 */
export default defineConfig(({ mode }) => {
  // When running vite build directly
  if (mode === "jsx") {
    return jsxConfig;
  }

  // Default: ESM/CJS build
  return esmCjsConfig;
});

// Also export individual configs for programmatic use
export { esmCjsConfig, jsxConfig };
