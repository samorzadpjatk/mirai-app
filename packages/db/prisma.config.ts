import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
    seed: "bun ./seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
