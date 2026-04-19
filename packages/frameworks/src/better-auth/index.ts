/**
 * Better Auth Configuration Factory
 *
 * This module provides the `createBetterAuth` factory function for configuring
 * Better Auth with Drizzle adapter, email/password authentication, and email OTP.
 *
 * Configuration:
 * - Drizzle adapter with PostgreSQL provider
 * - Email and password authentication
 * - Email OTP for verification and sign-in
 * - 7-day session expiry with 1-day update age
 * - Secure cookie defaults
 *
 * @see https://www.better-auth.com/
 * @see https://www.better-auth.com/docs/concepts/database
 */

import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import type { DrizzleDb } from "../drizzle/client";
import type { IEmailPort } from "@mirai-app/domain";
import {
  betterAuthUser,
  betterAuthSession,
  betterAuthAccount,
  betterAuthVerification,
} from "./schema";

/**
 * Configuration options for createBetterAuth factory
 */
export interface BetterAuthFactoryConfig {
  /** Better Auth secret key for encryption (falls back to BETTER_AUTH_SECRET env var) */
  secret?: string;
  /** Base URL for the application (falls back to BETTER_AUTH_URL env var, required) */
  baseUrl?: string;
  /** Email port for sending verification emails (if not provided, uses console fallback) */
  emailPort?: IEmailPort;
  /** Disable secure cookies (only for development) */
  disableSecureCookies?: boolean;
}

/**
 * Type representing a configured Better Auth instance
 */
export type BetterAuthInstance = ReturnType<typeof betterAuth>;

/**
 * Creates a sendVerificationOTP callback using the email port
 *
 * Wraps the Effect-based email port into a Promise-based callback
 * for Better Auth integration.
 */
const createSendVerificationOTP = (emailPort: IEmailPort) => {
  return async (data: {
    email: string;
    otp: string;
    type: "email-verification" | "sign-in" | "forget-password" | "change-email";
  }): Promise<void> => {
    const { Effect } = await import("effect");
    const program = emailPort.sendOtp(data);
    await Effect.runPromise(program);
  };
};

/**
 * Create a configured Better Auth instance
 *
 * This factory function creates a Better Auth instance with the following configuration:
 *
 * 1. **Drizzle Adapter**: Uses PostgreSQL provider with the Better Auth schema tables
 * 2. **Email and Password**: Enabled for traditional authentication
 * 3. **Email OTP Plugin**: Configured for verification and sign-in flows
 * 4. **Session Management**: 7-day expiry, 1-day update age
 * 5. **Security**: httpOnly, secure, and sameSite cookies
 * 6. **Base Path**: `/api/auth` for all auth endpoints
 *
 * @param db - Drizzle database instance
 * @param config - Optional configuration overrides
 * @returns Configured Better Auth instance
 *
 * @example
 * ```typescript
 * import { createDrizzleClient } from "@mirai-app/frameworks/drizzle";
 * import { createBetterAuth } from "@mirai-app/frameworks/better-auth";
 *
 * const db = createDrizzleClient(process.env.DATABASE_URL);
 * const auth = createBetterAuth(db);
 *
 * // Use in Hono route
 * app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
 * ```
 */
export function createBetterAuth(
  db: DrizzleDb,
  config: BetterAuthFactoryConfig = {},
): BetterAuthInstance {
  const secret = config.secret ?? process.env.BETTER_AUTH_SECRET;
  const baseUrl = config.baseUrl ?? process.env.BETTER_AUTH_URL;

  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET environment variable is required. " +
        "Provide it via config.secret or set the env var.",
    );
  }

  if (!baseUrl) {
    throw new Error(
      "BETTER_AUTH_URL environment variable is required. " +
        "Provide it via config.baseUrl or set the env var.",
    );
  }

  const options: BetterAuthOptions = {
    // Core configuration
    secret,
    baseURL: baseUrl,
    basePath: "/api/auth",

    // Database adapter with Drizzle ORM
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: betterAuthUser,
        session: betterAuthSession,
        account: betterAuthAccount,
        verification: betterAuthVerification,
      },
    }),

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      // Require email verification before sign-in
      requireEmailVerification: true,
    },

    // Session configuration: 7 days expiry, 1 day update age
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      updateAge: 60 * 60 * 24, // 1 day in seconds
      // Cookie configuration for security
      cookieCache: {
        enabled: true,
        maxAge: 300, // 5 minutes cache
      },
    },

    // Advanced configuration
    advanced: {
      // Disable cross-subdomain cookies (safer default)
      crossSubDomainCookies: {
        enabled: false,
      },
      // Use secure cookies by default (disable only in development)
      useSecureCookies: !config.disableSecureCookies,
    },

    // Plugins
    plugins: [
      // Email OTP plugin for verification and sign-in
      emailOTP({
        // 5 minute OTP expiry
        expiresIn: 300,
        // Send OTP callback - uses email port if configured, otherwise logs to console
        async sendVerificationOTP({ email, otp, type }) {
          if (config.emailPort) {
            const sendVerificationOTP = createSendVerificationOTP(config.emailPort);
            await sendVerificationOTP({ email, otp, type });
          } else {
            // Fallback: log to console for development
            console.warn(
              "[BetterAuth] OTP not sent - no email service configured. " +
                `Email: ${email}, OTP: ${otp}, Type: ${type}`,
            );
          }
        },
      }),
    ],

    // Social providers (can be enabled via config)
    socialProviders: {},
  };

  return betterAuth(options);
}

export * from "./schema";
export * from "./client";
