const config = {
  forbidden: [
    // Layer rules: inward dependencies only
    {
      name: "domain-no-deps",
      comment: "Domain layer must be pure",
      severity: "error",
      from: { path: "^packages/domain" },
      to: { path: "^packages/(application|infrastructure|shared|apps)" },
    },
    {
      name: "application-only-depends-on-domain",
      severity: "error",
      from: { path: "^packages/application" },
      to: { pathNot: "^packages/domain" },
    },
    {
      name: "infrastructure-only-depends-on-inner-layers",
      severity: "error",
      from: { path: "^packages/infrastructure" },
      to: { pathNot: "^packages/(application|domain)" },
    },
    {
      name: "packages-no-app-deps",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },

    // API boundaries: enforce public API only
    {
      name: "apps-use-package-public-api",
      comment: "Apps must use package public APIs",
      severity: "warn",
      from: {
        path: "^apps/",
        pathNot: [
          "\\.(test|spec|bench)\\.ts$",
          "\\.e2e\\.test\\.ts$",
          "__tests__/",
          "^apps/seed/",
        ],
      },
      to: {
        path: "^packages/.+/src/",
        pathNot: [
          // Package indices (main entry and subdirectories)
          "^packages/[^/]+/src/index\\.ts$",
          "^packages/[^/]+/src/[^/]+/index\\.ts$",
          // Frameworks package exports
          "^packages/frameworks/src/(supabase|auth|graphql|drizzle|stores|storage|di|layers|prisma|trpc)/",
          "^packages/frameworks/src/(supabase|auth)/react\\.tsx$",
          "^packages/frameworks/src/(supabase|auth)/client\\.ts$",
          "^packages/frameworks/src/auth/server\\.ts$",
          "^packages/frameworks/src/graphql/(client|native-client|server|builder|schema)\\.tsx?$",
          "^packages/frameworks/src/auth/store/index\\.ts$",
          "^packages/frameworks/src/auth/hooks/index\\.ts$",
          // GraphQL client compiled exports
          "^packages/graphql-client/dist/src/(index|generated/urql)\\.js$",
        ],
      },
    },

    // Quality rules
    {
      name: "no-circular-deps",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      comment: "Flag unimported files",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "\\.(test|spec|bench)\\.ts$",
          "\\.e2e\\.test\\.ts$",
          "__tests__/",
          "__mocks__/",
          "\\.mocks\\.",
          "index\\.ts$",
          "server\\.ts$",
          "noop-preload\\.ts$",
          "codegen\\.ts$",
          "(tailwind|metro|babel|jest|commitlint)\\.config\\.",
          "jest\\.setup\\.",
          "runtimeEnv\\.ts$",
          "\\.dependency-cruiser\\.mjs$",
          "types\\.ts$",
          "/types/",
          "constants\\.ts$",
          "challengeFormConstants\\.ts$",
          "coverage/",
          "test-helpers",
          "testHelpers",
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
