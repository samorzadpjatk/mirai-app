import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/schema.graphql",
  documents: "src/graphql/**/*.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: "graphql-request",
        reactQueryVersion: 5,
        exposeQueryKeys: true,
      },
    },
  },
};

export default config;
