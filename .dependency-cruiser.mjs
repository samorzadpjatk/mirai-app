/**
 * Dependency Cruiser Configuration
 *
 * Enforces Clean Architecture layer boundaries and code quality rules.
 * Dependency direction must flow inward: Frameworks → Adapters → Use Cases → Domain
 */

// Test file patterns (excluded from certain architectural rules)
const TEST_PATTERNS = [
  "\\.(test|spec|bench)\\.tsx?$",
  "\\.e2e\\.test\\.tsx?$",
  "__tests__/",
  "__mocks__/",
];

// Package layer patterns for boundary enforcement
const PACKAGES = {
  domain: "^packages/domain/",
  useCases: "^packages/use-cases/",
  adapters: "^packages/adapters/",
  frameworks: "^packages/frameworks/",
  shared: "^packages/shared/",
  graphqlClient: "^packages/graphql-client/",
  all: "^packages/",
};

const config = {
  forbidden: [
    // ============================================================
    // LAYER BOUNDARY RULES (DDD/Clean Architecture)
    // ============================================================
    // Why: Inward dependencies ensure business logic remains testable,
    // framework-agnostic, and stable regardless of UI or infrastructure changes.

    {
      name: "domain-pure",
      comment:
        "Domain must remain pure - no dependencies on other layers. " +
        "Business logic should not know about databases, APIs, or UI frameworks.",
      from: { path: PACKAGES.domain },
      to: {
        path: [
          PACKAGES.useCases,
          PACKAGES.adapters,
          PACKAGES.frameworks,
          PACKAGES.shared,
          "^packages/(apps|graphql-client)/",
        ].join("|"),
      },
    },

    {
      name: "use-cases-depends-on-domain-only",
      comment:
        "Use cases orchestrate domain objects but must not depend on outer layers " +
        "like adapters or frameworks (prevents leaking infrastructure into business logic).",
      from: {
        path: PACKAGES.useCases,
        pathNot: TEST_PATTERNS,
      },
      to: {
        path: [
          PACKAGES.adapters,
          PACKAGES.frameworks,
          PACKAGES.shared,
          "^packages/(apps|graphql-client)/",
        ].join("|"),
      },
    },

    {
      name: "adapters-no-apps",
      comment:
        "Adapters translate between domain and frameworks but cannot depend on apps. " +
        "Apps depend on adapters, never the reverse (dependency inversion).",
      from: {
        path: PACKAGES.adapters,
        pathNot: TEST_PATTERNS,
      },
      to: { path: "^apps/" },
    },

    {
      name: "packages-no-app-deps",
      comment:
        "Reusable packages must not depend on app-specific code. " +
        "Apps are deployment targets; packages are reusable libraries.",
      from: { path: PACKAGES.all },
      to: { path: "^apps/" },
    },

    // ============================================================
    // API BOUNDARY RULES
    // ============================================================
    // Why: Public APIs are the contract between packages. Internal modules
    // can change; index.ts exports should remain stable for consumers.

    {
      name: "use-public-apis",
      severity: "warn",
      comment:
        "Import from package index.ts (public API) instead of internal modules. " +
        "This decouples consumers from internal implementation details.",
      from: {
        path: "^apps/",
        pathNot: [...TEST_PATTERNS, "^apps/seed/"],
      },
      to: {
        path: "^packages/[^/]+/src/.+",
        pathNot: [
          // Public API: index exports
          "^packages/[^/]+/src/index\\.ts$",
          // Public API: frameworks sub-module exports
          "^packages/frameworks/src/[^/]+/(index|client|server|react|hooks|store)\\.tsx?$",
          // Build outputs for graphql-client
          "^packages/graphql-client/dist/",
        ],
      },
    },

    // ============================================================
    // QUALITY RULES
    // ============================================================
    // Why: These catch structural issues that lead to maintenance problems.

    {
      name: "no-circular-deps",
      comment:
        "Circular dependencies create tight coupling where modules cannot be " +
        "understood or tested in isolation. Refactor to break the cycle.",
      from: {},
      to: { circular: true },
    },

    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Orphan files are not imported anywhere and may be dead code. " +
        "Exclude tests, configs, and entry points that are meant to be standalone.",
      from: {
        orphan: true,
        pathNot: [
          ...TEST_PATTERNS,
          // Entry points
          "index\\.tsx?$",
          "server\\.tsx?$",
          "client\\.tsx?$",
          "react\\.tsx?$",
          // Config files
          "(tailwind|metro|babel|jest|commitlint)\\.config\\.",
          "jest\\.setup\\.",
          "runtimeEnv\\.ts$",
          "codegen\\.ts$",
          "\\.dependency-cruiser\\.mjs$",
          "noop-preload\\.ts$",
          // Type definitions and constants
          "types\\.tsx?$",
          "/types/",
          "constants\\.tsx?$",
          // Coverage reports
          "coverage/",
          // Test utilities
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
