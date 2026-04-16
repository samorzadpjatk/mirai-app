import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Codegen Configuration
 *
 * Generates TypeScript types and urql hooks from the GraphQL schema.
 */
const config: CodegenConfig = {
  schema: "./src/graphql/generated/graphql/schema.graphql",
  documents: "./src/graphql/generated/graphql/**/*.graphql",
  generates: {
    // Base types and urql hooks
    "./src/graphql/generated/urql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-urql"],
      config: {
        withSubscription: true,
        scalars: {
          DateTime: "Date",
          JSON: "unknown",
        },
      },
    },
  },
};

export default config;
