import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AUTHENTIK_SERVICE_ACCOUNT_TOKEN: z.string(),
    AUTHENTIK_ISSUER: z.url(),
    ADMIN_ROLE: z.string(),
    MODERATOR_ROLE: z.string(),
    TECH_ROLE: z.string(),
    SERVICE_ACCOUNT_ROLE: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    AUTHENTIK_SERVICE_ACCOUNT_TOKEN:
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN,
    AUTHENTIK_ISSUER: process.env.AUTHENTIK_ISSUER,
    ADMIN_ROLE: process.env.ADMIN_ROLE,
    MODERATOR_ROLE: process.env.MODERATOR_ROLE,
    TECH_ROLE: process.env.TECH_ROLE,
    SERVICE_ACCOUNT_ROLE: process.env.SERVICE_ACCOUNT_ROLE,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
