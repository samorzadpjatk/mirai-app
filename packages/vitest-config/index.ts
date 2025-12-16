import path from "node:path";
import { defineConfig } from "vitest/config";
import type { ViteUserConfigExport } from "vitest/config";

type CoverageReporter = "text" | "json-summary" | "json" | "lcov" | "clover" | "html";

export interface CreateVitestConfigOptions {
  dirname: string;
  environment?: "node" | "jsdom" | "happy-dom" | "edge-runtime" | string;
  globals?: boolean;
  alias?: Record<string, string>;
  setupFiles?: string[];
  include?: string[];
  coverage?: boolean | {
    enabled?: boolean;
    reporter?: CoverageReporter | CoverageReporter[];
    [key: string]: any;
  };
  deps?: {
    optimizer?: {
      web?: {
        enabled?: boolean;
      };
      ssr?: {
        enabled?: boolean;
      };
    };
  };
}

const coverageReporters = ["text", "json-summary", "json", "lcov", "clover", "html"] as const;

const resolveFromRoot = (root: string, target: string): string =>
  path.isAbsolute(target) ? target : path.resolve(root, target);

/**
 * Creates a Vitest config with Integral defaults and project level overrides.
 */
export const createVitestConfig = (options: CreateVitestConfigOptions = {} as CreateVitestConfigOptions): ViteUserConfigExport => {
  const {
    dirname,
    environment = "jsdom",
    globals = true,
    alias = {},
    setupFiles = [],
    include = ["src/**/*.{test,spec}.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    coverage = true,
    deps,
  } = options;

  if (!dirname) {
    throw new Error("createVitestConfig requires the absolute project dirname");
  }

  const normalizedAliasEntries = Object.entries({
    "~": path.resolve(dirname, "src"),
    ...alias,
  }).map(([key, value]): [string, string] => [key, resolveFromRoot(dirname, value as string)]);

  const normalizedSetupFiles = setupFiles.map((file: string) => resolveFromRoot(dirname, file));

  const coverageOptions =
    coverage && typeof coverage === "object"
      ? { enabled: true, reporter: coverage.reporter ?? [...coverageReporters], ...coverage }
      : coverage
        ? { enabled: true, reporter: [...coverageReporters] }
        : undefined;

  return defineConfig({
    resolve: {
      alias: Object.fromEntries(normalizedAliasEntries),
    },
    test: {
      globals,
      environment,
      setupFiles: normalizedSetupFiles,
      include,
      coverage: coverageOptions,
      deps,
    },
  });
};
