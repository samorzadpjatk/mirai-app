const config = {
  forbidden: [
    // ─────────────────────────────────────────────────────────────
    // Clean architecture layer rules
    // ─────────────────────────────────────────────────────────────

    {
      name: "domain-no-deps",
      severity: "error",
      from: { path: "^packages/domain" },
      to: {
        path: "^packages/(application|infrastructure|shared|apps)",
      },
    },

    {
      name: "application-only-depends-on-domain-and-shared",
      severity: "error",
      from: { path: "^packages/application" },
      to: {
        pathNot: "^packages/(domain|shared)",
      },
    },

    {
      name: "infrastructure-no-apps",
      severity: "error",
      from: { path: "^packages/infrastructure" },
      to: {
        path: "^apps/",
      },
    },

    {
      name: "no-app-imports-into-packages",
      severity: "error",
      from: { path: "^packages/" },
      to: {
        path: "^apps/",
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Workspace boundary enforcement
    // ─────────────────────────────────────────────────────────────

    {
      name: "domain-no-cross-imports",
      severity: "error",
      from: { path: "^packages/domain/" },
      to: {
        path: "^packages/",
        pathNot: "^packages/domain/",
      },
    },
    {
      name: "apps-no-deep-package-imports",
      comment: "Flag imports that bypass package public API (index.ts exports)",
      severity: "warn",
      from: {
        path: "^apps/",
        // Exclude test files (they may need internal APIs for testing)
        pathNot: [
          "\\.test\\.ts$",
          "\\.spec\\.ts$",
          "__tests__/",
          "\\.bench\\.ts$",
          "\\.e2e\\.test\\.ts$",
          // Seed app is a utility with special access needs
          "^apps/seed/",
        ],
      },
      to: {
        path: "^packages/.+/src/",
        // Allow package index files and export paths defined in package.json
        pathNot: [
          // Package index files (public API entry points)
          "^packages/[^/]+/src/index\\.ts$",
          // Frameworks package exports (defined in package.json exports field)
          "^packages/frameworks/src/(supabase|auth|graphql|drizzle|stores|storage|di|layers)/index\\.ts$",
          "^packages/frameworks/src/(supabase|auth|graphql|drizzle)/react\\.tsx$",
          "^packages/frameworks/src/(supabase|auth)/client\\.ts$",
          "^packages/frameworks/src/auth/server\\.ts$",
          "^packages/frameworks/src/auth/store/index\\.ts$",
          "^packages/frameworks/src/auth/hooks/index\\.ts$",
          "^packages/frameworks/src/graphql/(client|native-client|server|builder|schema)\\.tsx?$",
          // GraphQL client compiled exports
          "^packages/graphql-client/dist/src/(index|generated/urql)\\.js$",
          // Deep imports from same package (internal organization)
          "^packages/[^/]+/src/[^/]+/index\\.ts$",
        ],
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Technical hygiene
    // ─────────────────────────────────────────────────────────────

    {
      name: "no-circular-deps",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },

    {
      name: "no-orphans",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "\\.test\\.ts$",
          "\\.spec\\.ts$",
          "index\\.ts$",
          // Config files used by tooling
          "codegen\\.ts$",
          "tailwind\\.config\\.",
          "metro\\.config\\.",
          "babel\\.config\\.",
          "jest\\.config\\.",
          "jest\\.setup\\.",
          "commitlint\\.config\\.",
          "\.dependency-cruiser\\.mjs$",
          // Mock files for testing
          "__mocks__",
          "\\.mocks\\.",
          // Test helpers
          "__tests__/(test-helpers|testHelpers)",
          // Coverage report artifacts
          "coverage/",
          // Server entry points
          "apps/backend-server/src/server\\.ts$",
          "apps/backend-server/noop-preload\\.ts$",
          // Types files are often imported via path aliases (matches files in types/ folders or named types.ts)
          "types\\.ts$",
          "/types/",
          // Constants/config files used via path aliases
          "constants\\.ts$",
          "runtimeEnv\\.ts$",
          "challengeFormConstants\\.ts$",
          // Seed app internal types
          "apps/seed/src/types\\.ts$",
        ],
      },
      to: {},
    },

    {
      name: "ignore-orphans-in-ports-and-prisma",
      severity: "ignore",
      from: {
        path: "(ports|prisma/lib/models)",
      },
      to: {},
    },

    {
      name: "apps-can-import-frameworks-public-api",
      severity: "ignore",
      from: { path: "^apps/" },
      to: {
        path: "^packages/frameworks/src/(trpc|auth|supabase|prisma)/",
      },
    },
  ],

  options: {
    // Bun + TS friendly
    tsConfig: {
      fileName: "tsconfig.json",
    },

    // Respect package.json exports
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "default"],
    },

    // Ignore build artifacts
    doNotFollow: {
      path: ["node_modules", "dist", "build", "\\.d\\.ts$"],
    },

    // ESM support
    moduleSystems: ["es6"],

    // Keep output deterministic
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
    },
  },
};

export default config;
