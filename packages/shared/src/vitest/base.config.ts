import { defineConfig, type ViteUserConfig } from "vitest/config";
import path from "path";

interface CreateVitestConfigOptions {
  /** Test environment: "node" | "jsdom" | "happy-dom" | "edge-runtime" */
  environment?: "node" | "jsdom" | "happy-dom" | "edge-runtime";
  /** Additional setup files */
  setupFiles?: string[];
  /** Additional test file patterns */
  include?: string[];
  /** Additional coverage exclude patterns */
  coverageExcludes?: string[];
  /** Coverage thresholds override */
  coverageThresholds?: {
    branches?: number;
    functions?: number;
    lines?: number;
    statements?: number;
  };
  /** Additional path aliases */
  aliases?: Record<string, string>;
  /** Override any vitest config field */
  overrides?: ViteUserConfig;
}

/**
 * Creates a standardized Vitest configuration for MIRAI monorepo workspaces.
 *
 * Defaults:
 * - globals: true
 * - environment: "node"
 * - coverage provider: v8
 * - coverage reporters: text, json, html
 * - coverage thresholds: 75% across all metrics
 * - alias "~" points to "./src"
 * - include: src/__tests__ with glob wildcards for .test.ts files
 */
export function createVitestConfig(options: CreateVitestConfigOptions = {}): ViteUserConfig {
  const {
    environment = "node",
    setupFiles = [],
    include = [],
    coverageExcludes = [],
    coverageThresholds = {},
    aliases = {},
    overrides = {},
  } = options;

  const defaultInclude = ["src/**/__tests__/**/*.test.ts"];
  const mergedInclude = include.length > 0 ? [...defaultInclude, ...include] : defaultInclude;

  const defaultCoverageExcludes = [
    "node_modules/",
    "dist/",
    "**/*.d.ts",
    "**/*.config.*",
    "**/vitest.setup.ts",
    "src/test-utils/**",
  ];
  const mergedCoverageExcludes =
    coverageExcludes.length > 0
      ? [...defaultCoverageExcludes, ...coverageExcludes]
      : defaultCoverageExcludes;

  const defaultThresholds = {
    branches: 75,
    functions: 75,
    lines: 75,
    statements: 75,
  };

  const mergedAliases: Record<string, string> = {
    "~": path.resolve(process.cwd(), "./src"),
    ...Object.fromEntries(
      Object.entries(aliases).map(([key, value]) => [key, path.resolve(process.cwd(), value)]),
    ),
  };

  return defineConfig({
    test: {
      globals: true,
      environment,
      ...(setupFiles.length > 0 && { setupFiles }),
      include: mergedInclude,
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: mergedCoverageExcludes,
        thresholds: {
          ...defaultThresholds,
          ...coverageThresholds,
        },
      },
    },
    resolve: {
      alias: mergedAliases,
    },
    ...overrides,
  });
}
