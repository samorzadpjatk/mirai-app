const config = {
  forbidden: [
    // === Layer Boundary Rules (DDD/Clean Architecture) ===
    // Dependency direction: Frameworks → Adapters → Use Cases → Domain
    {
      name: "domain-pure",
      comment:
        "Domain layer must have no external dependencies (pure business logic)",
      severity: "error",
      from: { path: "^packages/domain/" },
      to: {
        path: "^packages/(use-cases|adapters|frameworks|shared|apps|graphql-client)/",
      },
    },
    {
      name: "use-cases-depends-on-domain-only",
      comment:
        "Use cases can only depend on domain and node_modules (test files may use adapters)",
      severity: "error",
      from: {
        path: "^packages/use-cases/",
        pathNot: [
          // Test files may import from adapters for mock implementations
          "\\.(test|spec)\\.tsx?$",
          "__tests__/",
        ],
      },
      to: {
        path: "^packages/(adapters|frameworks|shared|apps|graphql-client)/",
      },
    },
    {
      name: "adapters-depends-on-inner-layers",
      comment:
        "Adapters can depend on use-cases, domain, shared, and frameworks (not apps)",
      severity: "error",
      from: {
        path: "^packages/adapters/",
        pathNot: [
          // Test files can use internal modules and testing frameworks
          "\\.(test|spec)\\.tsx?$",
          "__tests__/",
        ],
      },
      to: {
        path: "^apps/",
      },
    },
    {
      name: "packages-no-app-deps",
      comment: "Shared packages cannot depend on apps",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },

    // === API Boundary Rules ===
    {
      name: "use-public-apis",
      comment: "Use package index.ts exports instead of internal modules",
      severity: "warn",
      from: {
        path: "^apps/",
        pathNot: [
          // Tests and special files
          "\\.(test|spec|bench)\\.tsx?$",
          "\\.e2e\\.test\\.tsx?$",
          "__tests__/",
          "^apps/seed/",
        ],
      },
      to: {
        path: "^packages/[^/]+/src/.+",
        pathNot: [
          // Allow package index files (public API)
          "^packages/[^/]+/src/index\\.ts$",
          // Allow frameworks sub-module exports (intended public API)
          "^packages/frameworks/src/[^/]+/(index|client|server|react|hooks|store)\\.tsx?$",
          // Allow graphql-client dist exports
          "^packages/graphql-client/dist/",
        ],
      },
    },

    // === Quality Rules ===
    {
      name: "no-circular-deps",
      comment: "Circular dependencies create tight coupling",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      comment: "Files should be imported or be entry points",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          // Tests
          "\\.(test|spec|bench)\\.tsx?$",
          "\\.e2e\\.test\\.tsx?$",
          "__tests__/",
          "__mocks__/",
          // Entry points
          "index\\.tsx?$",
          "server\\.tsx?$",
          "client\\.tsx?$",
          "react\\.tsx?$",
          // Config
          "(tailwind|metro|babel|jest|commitlint)\\.config\\.",
          "jest\\.setup\\.",
          "runtimeEnv\\.ts$",
          "codegen\\.ts$",
          // Dev/Build
          "\\.dependency-cruiser\\.mjs$",
          "noop-preload\\.ts$",
          // Types
          "types\\.tsx?$",
          "/types/",
          "constants\\.tsx?$",
          // Coverage
          "coverage/",
          // Test helpers
          "(test-helpers|testHelpers)",
        ],
      },
      to: {},
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "default"],
    },
    doNotFollow: { path: ["node_modules", "dist", "build", "\\.d\\.ts$"] },
    moduleSystems: ["es6"],
    reporterOptions: { dot: { collapsePattern: "node_modules/[^/]+" } },
  },
};

export default config;
