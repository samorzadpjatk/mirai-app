import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/generated/graphql/schema.graphql",
  documents: "src/generated/graphql/**/*.graphql",
  generates: {
    // urql hooks for frontend apps (supports subscriptions)
    "src/generated/urql.ts": {
      plugins: ["typescript-urql"],
      config: {
        withSubscription: true,
      },
    },
  },
};

export default config;
