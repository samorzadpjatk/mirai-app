import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    reporters: ["default"],
    hookTimeout: 15000,
    testTimeout: 20000,
  },
});
