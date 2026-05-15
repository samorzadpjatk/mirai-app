import nx from "@nx/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@nx": nx,
    },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          allow: [],
          checkDynamicDependenciesExceptions: ["@mirai-app/auth"],
          depConstraints: [
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: ["type:package"],
            },
            {
              sourceTag: "type:package",
              onlyDependOnLibsWithTags: ["type:package"],
            },
            {
              sourceTag: "scope:shared",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
            {
              sourceTag: "scope:db",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:db"],
            },
            {
              sourceTag: "scope:auth",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:db", "scope:auth"],
            },
            {
              sourceTag: "scope:api",
              onlyDependOnLibsWithTags: ["scope:shared", "scope:db", "scope:auth", "scope:api"],
            },
            {
              sourceTag: "scope:api",
              onlyDependOnLibsWithTags: ["*"],
            },
            {
              sourceTag: "scope:mobile",
              onlyDependOnLibsWithTags: ["*"],
            },
            {
              sourceTag: "scope:worker",
              onlyDependOnLibsWithTags: ["*"],
            },
            {
              sourceTag: "scope:cli",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/.nx/**",
      "**/coverage/**",
      "**/drizzle/**",
    ],
  },
);
