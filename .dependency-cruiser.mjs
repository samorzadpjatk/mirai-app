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
      severity: "warn",
      from: { path: "^apps/" },
      to: {
        path: "^packages/.+/src/",
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
        pathNot: ["\\.test\\.ts$", "\\.spec\\.ts$", "index\\.ts$"],
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
