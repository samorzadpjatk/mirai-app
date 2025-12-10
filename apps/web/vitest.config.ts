import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/**/__tests__/**",
        "**/*.config.*",
        "**/index.ts",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@integral-2025-app/auth": path.resolve(
        __dirname,
        "../../packages/auth/src/index.ts",
      ),
      "@integral-2025-app/auth/client": path.resolve(
        __dirname,
        "../../packages/auth/src/supabaseClient.ts",
      ),
      "@integral-2025-app/common-types": path.resolve(
        __dirname,
        "../../packages/common-types/src/index.ts",
      ),
    },
  },
});
