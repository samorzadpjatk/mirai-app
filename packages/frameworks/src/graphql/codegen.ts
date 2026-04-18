// =============================================================================
// GraphQL Codegen Configuration
// =============================================================================

import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Code Generator Configuration
 *
 * Generates TypeScript types and urql hooks from:
 * 1. The Pothos schema (schema.graphql)
 * 2. All .gql files in the gql/ directory
 *
 * ## Usage
 *
 * ```bash
 * # Generate schema from Pothos and then generate types
 * bun run sync:schema
 * ```
 *
 * ## Output
 *
 * Generated files go to packages/frameworks/src/graphql/client/generated/
 * - types.ts - TypeScript types from schema
 * - operations.ts - Operation types (queries/mutations/subscriptions)
 * - urql.ts - Typed urql hooks for React
 * - introspection.json - Schema introspection for clients
 */

const config: CodegenConfig = {
  schema: "./src/graphql/schema.graphql",
  documents: ["./src/graphql/gql/**/*.graphql"],
  generates: {
    // =======================================================================
    // Main TypeScript Types
    // =======================================================================
    "./src/graphql/client/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        scalars: {
          DateTime: "Date",
          JSON: "unknown",
          ID: "string",
        },
        enumsAsTypes: true,
        skipTypename: false,
        declarationKind: "interface",
      },
    },

    // =======================================================================
    // Operation Types (Queries/Mutations/Subscriptions)
    // =======================================================================
    "./src/graphql/client/generated/operations.ts": {
      preset: "import-types",
      presetConfig: {
        typesPath: "./types",
      },
      plugins: ["typescript-operations"],
      config: {
        scalars: {
          DateTime: "Date",
          JSON: "unknown",
          ID: "string",
        },
        enumsAsTypes: true,
        skipTypename: false,
        preResolveTypes: true,
        mergeFragmentTypes: true,
      },
    },

    // =======================================================================
    // urql React Hooks
    // =======================================================================
    "./src/graphql/client/generated/urql.ts": {
      preset: "import-types",
      presetConfig: {
        typesPath: "./types",
      },
      plugins: ["typescript-urql"],
      config: {
        scalars: {
          DateTime: "Date",
          JSON: "unknown",
          ID: "string",
        },
        enumsAsTypes: true,
        skipTypename: false,
        withComponent: false,
        withHooks: true,
        urqlImportFrom: "@urql/core",
      },
    },

    // =======================================================================
    // Schema Introspection (for clients)
    // =======================================================================
    "./src/graphql/client/generated/introspection.json": {
      plugins: ["introspection"],
      config: {
        minify: false,
      },
    },

    // =======================================================================
    // Schema SDL (for documentation)
    // =======================================================================
    "./src/graphql/schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
        sort: true,
      },
    },
  },

  // =============================================================================
  // Global Configuration
  // =============================================================================
  config: {
    avoidOptionals: {
      field: true,
      inputValue: false,
      object: true,
    },
    strictScalars: true,
  },

  hooks: {
    afterAllFileWrite: ["prettier --write"],
  },
};

export default config;
