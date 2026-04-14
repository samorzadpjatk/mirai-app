// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import { tamaguiPlugin } from "@tamagui/vite-plugin";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: node({ mode: "standalone" }),
  output: "server",
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    plugins: [
      // Tamagui Vite plugin for CSS compilation and token resolution
      // disableInjectCSS is required for SSR compatibility with Astro
      tamaguiPlugin({
        config: path.resolve(__dirname, "../../packages/ui/tamagui.config.ts"),
        components: ["tamagui"],
        disableInjectCSS: true, // Critical for SSR - CSS is inlined instead of injected
      }),
    ],
    resolve: {
      alias: {
        // Ensure react-native resolves to react-native-web for Tamagui components
        "react-native": "react-native-web",
      },
      dedupe: ["react", "react-dom", "react-native-web"],
    },
    optimizeDeps: {
      include: [
        "tamagui",
        "@tamagui/core",
        "@tamagui/config",
        "react-native-web",
      ],
      exclude: ["react-native"],
    },
    ssr: {
      // Ensure Tamagui packages are properly handled for SSR
      noExternal: ["tamagui", "@tamagui/core", "@tamagui/web"],
    },
  },
});
