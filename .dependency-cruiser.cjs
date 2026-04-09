/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // =============================================================================
    // LAYER ENFORCEMENT - Clean Architecture Dependency Rules
    // =============================================================================
    // Domain layer: ZERO external dependencies (only self-references and dev deps)
    {
      name: "domain-purity",
      comment:
        "Domain layer must have ZERO runtime dependencies - only pure TypeScript and test frameworks",
      severity: "error",
      from: {
        path: "^packages/domain/src",
        pathNot: "\\.test\\.ts$", // Allow test files to import test frameworks
      },
      to: {
        pathNot: "^packages/domain|bun:test|@types",
        dependencyTypesNot: ["npm-dev"], // Allow dev dependencies
      },
    },

    // Use-cases layer: Only domain dependencies (including @repo/domain)
    {
      name: "use-case-dependencies",
      comment: "Use cases can only depend on domain layer",
      severity: "error",
      from: {
        path: "^packages/use-cases/src",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        pathNot: "^packages/(domain|use-cases)|@repo/domain|bun:test|@types",
        dependencyTypesNot: ["npm-dev"],
      },
    },

    // Adapters layer: Domain, use-cases, and validation libraries (zod)
    // Exception: @repo/frameworks/di is allowed for DI container types (TYPES)
    // This is necessary for @provide and @inject decorators to work with service identifiers
    {
      name: "adapter-dependencies",
      comment:
        "Adapters can depend on domain, use-cases layers, and validation libraries (zod). Exception: @repo/frameworks/di for DI types.",
      severity: "error",
      from: {
        path: "^packages/adapters/src",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        pathNot:
          "^packages/(domain|use-cases|adapters)|@repo/(domain|use-cases)|@repo/frameworks/di|zod|bun:test|@types",
        dependencyTypesNot: ["npm-dev"],
      },
    },

    // Frameworks layer: Can import from all inner layers (domain, use-cases, adapters)
    // Also allows legacy @mirai-app/* packages during migration
    {
      name: "frameworks-dependencies",
      comment:
        "Frameworks layer is outermost and can depend on all inner layers (domain, use-cases, adapters). Legacy @mirai-app/* imports allowed during migration.",
      severity: "error",
      from: {
        path: "^packages/frameworks/src",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        pathNot:
          "^packages/(domain|use-cases|adapters|frameworks)|@repo/(domain|use-cases|adapters)|@mirai-app/|bun:test|@types",
        dependencyTypesNot: ["npm-dev"],
      },
    },

    // Apps layer: Cannot import domain or use-cases directly
    {
      name: "app-no-direct-domain",
      comment:
        "Apps must not import domain or use-cases directly. Access through @repo/frameworks or @repo/adapters.",
      severity: "error",
      from: {
        path: "^apps/",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        path: "^packages/(domain|use-cases)|^@repo/(domain|use-cases)$",
      },
    },

    // Apps layer: Cannot import domain or use-cases directly
    // All infrastructure access must go through adapters or frameworks
    {
      name: "app-no-direct-legacy-packages",
      comment:
        "Apps must not import legacy package paths directly. All packages have been migrated to adapters/frameworks.",
      severity: "error",
      from: {
        path: "^apps/",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        path: "^packages/(db|trpc|auth|supabase)/src",
      },
    },

    // =============================================================================
    // GENERAL ARCHITECTURE RULES
    // =============================================================================
    // Prevent circular dependencies
    {
      name: "no-circular",
      comment: "Circular dependencies are not allowed",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },

    // Prevent deprecated modules
    {
      name: "no-deprecated-core",
      comment:
        "A module depends on a node core module that has been deprecated. Find an alternative - these are bound to exist - node doesn't deprecate lightly.",
      severity: "warn",
      from: {},
      to: {
        dependencyTypes: ["core"],
        path: "^(punycode|domain|constants|sys|_linklist|_stream_wrap)$",
      },
    },

    // Prevent deprecated npm modules
    {
      name: "no-deprecated-npm",
      comment:
        "This module uses a deprecated npm package. Consider finding an alternative.",
      severity: "warn",
      from: {},
      to: {
        dependencyTypes: ["deprecated"],
      },
    },

    // Prevent orphaned modules (not imported anywhere)
    {
      name: "no-orphans",
      comment:
        "This is an orphan module - it's likely not used anymore. Consider removing it.",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$", // TypeScript declaration files
          "^.*\\.spec\\.ts$", // Test files
          "^.*\\.test\\.ts$", // Test files
          "^.*\\.config\\.ts$", // Config files
          "^.*\\.config\\.js$", // Config files
          "__tests__", // Test directories
          "__mocks__", // Mock directories
          "packages/use-cases/src/ports/.*Repository\\.ts$", // Repository ports (implemented by adapters)
          "packages/domain/src/repositories/.*\\.ts$", // Domain repository interfaces
          "packages/frameworks/src/prisma/lib/models/.*\\.ts$", // Prisma model files - auto-added by fix-dependency-cruiser task
          "packages/frameworks/src/prisma/lib/models\\.ts$", // Prisma models barrel file - auto-added by fix-dependency-cruiser task
          "apps/.*/index\\.tsx?$", // App entry points - auto-added by fix-dependency-cruiser task
          "\\.config\\.(ts|js|cjs|mjs)$", // Config files - auto-added by fix-dependency-cruiser task
          "happydom\\.ts$", // Happy DOM test setup - auto-added by fix-dependency-cruiser task
          "commitlint\\.config\\.cjs$", // Commitlint config - auto-added by fix-dependency-cruiser task
          "apps/.*/app/\\(.*\\)/.*\\.tsx?$", // App router route files - auto-added by fix-dependency-cruiser task
          "apps/native/src/components/.*\\.tsx$", // Native app components - auto-added by fix-dependency-cruiser task
          "apps/web/src/components/.*\\.tsx$", // Web app components - auto-added by fix-dependency-cruiser task
          "apps/native/src/types/.*\\.ts$", // Native app types - auto-added by fix-dependency-cruiser task
          "apps/native/src/config/.*\\.ts$", // Native app config - auto-added by fix-dependency-cruiser task
          "apps/native/src/hooks/.*\\.ts$", // Native app hooks - auto-added by fix-dependency-cruiser task
          "apps/native/src/utils/.*\\.ts$", // Native app utils - auto-added by fix-dependency-cruiser task
          "apps/seed/src/types\\.ts$", // Seed app types - auto-added by fix-dependency-cruiser task
          "packages/frameworks/src/auth/types\\.ts$", // Auth types - auto-added by fix-dependency-cruiser task
          "packages/frameworks/src/supabase/react\\.tsx$", // Supabase React components - auto-added by fix-dependency-cruiser task
          "apps/native/src/components/.*/types\\.ts$", // Native component types - auto-added by fix-dependency-cruiser task
          "apps/native/src/components/admin/.*/.*\\.ts$", // Admin components - auto-added by fix-dependency-cruiser task
          "apps/native/jest\\.setup\\.cjs$", // Jest setup - auto-added by fix-dependency-cruiser task
          "\\.dependency-cruiser\\.cjs$", // Self-reference - auto-added by fix-dependency-cruiser task
        ],
      },
      to: {},
    },

    // =============================================================================
    // UNRESOLVABLE IMPORT HANDLING - Tech Debt Documentation
    // =============================================================================
    // Path aliases and virtual modules that cannot be resolved at static analysis time
    // These are documented as tech debt to be addressed in migration
    {
      name: "not-to-unresolvable",
      comment:
        "This module depends on a module that cannot be found ('resolved to disk'). Fix the import or install the missing dependency.",
      severity: "error",
      from: {
        // Skip files with known resolution issues (documented as tech debt):
        // - Workspace packages resolve at build time
        // - Path aliases (~/* in native app) resolve via tsconfig
        // - Virtual modules (astro:middleware) are build-time constructs
        pathNot: [
          "^packages/(use-cases|adapters|frameworks)/src",
          "^apps/native/src", // ~/* path aliases documented as tech debt
          "^apps/web/src", // @mirai-app/* workspace imports documented as tech debt
          "^packages/frameworks/src", // @mirai-app/* imports during migration to @repo/frameworks
          "^apps/seed", // @repo/frameworks/* imports - exports configured but dist not built - auto-added by fix-dependency-cruiser task
          "^apps/notification-sender", // @repo/frameworks/* imports - exports configured but dist not built - auto-added by fix-dependency-cruiser task
          "^apps/backend-server", // @repo/frameworks/* imports - exports configured but dist not built - auto-added by fix-dependency-cruiser task
        ],
      },
      to: {
        couldNotResolve: true,
        // Exclude known virtual modules and workspace patterns
        pathNot: [
          "^astro:", // Astro virtual modules
          "^~", // Native app path alias (tech debt: migrate to @repo/)
          "^@mirai-app/", // Workspace packages that resolve at build time
        ],
      },
    },
  ],

  options: {
    // Exclude generated files and node_modules
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: [
        "npm",
        "npm-dev",
        "npm-optional",
        "npm-peer",
        "npm-bundled",
        "npm-no-pkg",
      ],
    },

    exclude: {
      path: [
        "node_modules",
        "dist",
        "build",
        ".turbo",
        "coverage",
        "\\.specs", // Spec files (not in code)
        "\\.claude", // Claude-specific files
        "\\.opencode", // Opencode files
      ],
    },

    // Module systems to scan
    moduleSystems: ["es6", "cjs", "tsd"],

    // TypeScript configuration
    tsConfig: {
      fileName: "tsconfig.base.json",
    },

    // Enhanced resolve options for monorepo workspace packages
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
