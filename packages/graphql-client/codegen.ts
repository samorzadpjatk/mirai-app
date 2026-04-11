import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/schema.graphql",
  documents: "src/graphql/**/*.graphql",
  generates: {
    // urql hooks for frontend apps (supports subscriptions)
    "src/generated/urql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-urql"],
      config: {
        withSubscription: true,
      },
    }
  },
};

export default config;
