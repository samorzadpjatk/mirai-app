/**
 * Environment Configuration Module
 *
 * Provides type-safe environment variable validation using Zod schema.
 * This is the foundation configuration for the new tech stack.
 *
 * Environment variables validated:
 * - Better Auth endpoints and configuration
 * - GraphQL endpoint URL
 * - SeaweedFS Filer URL for file uploads
 * - Admin-specific configuration
 *
 * @module @mirai-app/web/env
 */

import { z } from "zod";

// =============================================================================
// Environment Schema Definition
// =============================================================================

/**
 * Zod schema for public environment variables (available on client)
 */
const publicEnvSchema = z.object({
  // Better Auth Configuration
  PUBLIC_BETTER_AUTH_URL: z.string().default("http://localhost:4000/api/auth"),

  // GraphQL Configuration
  PUBLIC_GRAPHQL_URL: z.string().default("http://localhost:4000/api/graphql"),

  PUBLIC_GRAPHQL_WS_URL: z.string().default("ws://localhost:4000/api/graphql"),

  // SeaweedFS Configuration
  PUBLIC_SEAWEEDFS_TUS_URL: z.string().default("http://localhost:7333/tus"),

  PUBLIC_SEAWEEDFS_S3_URL: z.string().default("http://localhost:8333"),

  // App Configuration
  PUBLIC_APP_URL: z.string().default("http://localhost:4321"),
});

// =============================================================================
// Type Inference
// =============================================================================

/**
 * Type-safe public environment configuration
 */
export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Type-safe environment configuration (public only for web app)
 * Private env vars are server-only; the web app uses client-side auth
 */
export type EnvConfig = PublicEnv;

// =============================================================================
// Environment Parsing and Validation
// =============================================================================

/**
 * Parse and validate public environment variables
 * Throws if validation fails (fail-fast during build/startup)
 */
function parsePublicEnv(): PublicEnv {
  const env = {
    PUBLIC_BETTER_AUTH_URL: import.meta.env.PUBLIC_BETTER_AUTH_URL,
    PUBLIC_GRAPHQL_URL: import.meta.env.PUBLIC_GRAPHQL_URL,
    PUBLIC_GRAPHQL_WS_URL: import.meta.env.PUBLIC_GRAPHQL_WS_URL,
    PUBLIC_SEAWEEDFS_TUS_URL: import.meta.env.PUBLIC_SEAWEEDFS_TUS_URL,
    PUBLIC_SEAWEEDFS_S3_URL: import.meta.env.PUBLIC_SEAWEEDFS_S3_URL,
    PUBLIC_APP_URL: import.meta.env.PUBLIC_APP_URL,
  };

  const result = publicEnvSchema.safeParse(env);

  if (!result.success) {
    const message = result.error?.message ?? "Unknown validation error";
    throw new Error(
      `Environment validation failed: ${message}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
    );
  }

  return result.data;
}

// =============================================================================
// Exported Environment Configuration
// =============================================================================

/**
 * Type-safe environment configuration object
 * Available throughout the application
 *
 * @example
 * ```typescript
 * import { env } from '@/lib/env';
 *
 * const authUrl = env.PUBLIC_BETTER_AUTH_URL;
 * ```
 */
export const env: EnvConfig = parsePublicEnv();

// =============================================================================
// Environment Constants
// =============================================================================

/**
 * Environment constants for common values
 */
export const ENV = {
  /** Better Auth configuration */
  BETTER_AUTH: {
    URL: env.PUBLIC_BETTER_AUTH_URL,
    ENDPOINTS: {
      SIGN_IN: "/sign-in/email",
      SIGN_UP: "/sign-up/email",
      SIGN_OUT: "/sign-out",
      SESSION: "/session",
      OTP_SEND: "/email-otp/send-verification-otp",
      OTP_VERIFY: "/email-otp/verify-email",
    },
  },

  /** GraphQL configuration */
  GRAPHQL: {
    HTTP_URL: env.PUBLIC_GRAPHQL_URL,
    WS_URL: env.PUBLIC_GRAPHQL_WS_URL,
  },

  /** SeaweedFS configuration */
  STORAGE: {
    TUS_URL: env.PUBLIC_SEAWEEDFS_TUS_URL,
    S3_URL: env.PUBLIC_SEAWEEDFS_S3_URL,
    MAX_CHUNK_SIZE: 2 * 1024 * 1024, // 2MB chunks for resumable uploads
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB max file size
  },

  /** App configuration */
  APP: {
    URL: env.PUBLIC_APP_URL,
    LOGIN_PATH: "/login",
    DASHBOARD_PATH: "/",
  },
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if running in development mode
 */
export const isDevelopment = import.meta.env.DEV ?? false;

/**
 * Check if running in production mode
 */
export const isProduction = import.meta.env.PROD ?? false;

/**
 * Get the full Better Auth endpoint URL
 */
export function getBetterAuthEndpoint(
  endpoint: keyof typeof ENV.BETTER_AUTH.ENDPOINTS
): string {
  return `${ENV.BETTER_AUTH.URL}${ENV.BETTER_AUTH.ENDPOINTS[endpoint]}`;
}

/**
 * Validate environment at build time
 * Call this function in astro.config.mjs to fail fast on invalid config
 */
export function validateEnv(): void {
  try {
    parsePublicEnv();
    console.log("[env] Environment validation passed");
  } catch (error) {
    console.error("[env] Environment validation failed:", error);
    throw error;
  }
}
