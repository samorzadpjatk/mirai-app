/**
 * Better Auth Client Factory
 *
 * Creates a client for Better Auth API from React Native.
 * Communicates with Better Auth endpoints at /api/auth/*
 *
 * @module packages/frameworks/better-auth/client
 */

import type {
  BetterAuthClient,
  BetterAuthClientConfig,
  BetterAuthUser,
  BetterAuthSession,
  SignInCredentials,
  SignUpCredentials,
  OtpVerificationData,
} from "../stores";

// =============================================================================
// Client Factory
// =============================================================================

/**
 * Create a Better Auth client for React Native
 *
 * This client communicates with the Better Auth API endpoints.
 * Session persistence is handled by the betterAuthStore using SecureStore.
 *
 * @param config - Client configuration
 * @returns BetterAuthClient instance
 *
 * @example
 * ```typescript
 * const client = createBetterAuthClient({
 *   baseURL: "https://api.example.com",
 *   basePath: "/api/auth",
 * });
 *
 * // Use with betterAuthStore
 * betterAuthStore.getState().initialize({ client });
 * ```
 */
export function createBetterAuthClient(config: BetterAuthClientConfig): BetterAuthClient {
  const baseURL = config.baseURL;
  const basePath = config.basePath ?? "/api/auth";

  /**
   * Make a request to the Better Auth API
   */
  async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<{ data: T | null; error: { message: string } | null }> {
    try {
      const url = `${baseURL}${basePath}${path}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      // Better Auth returns 200 for success, various error codes for failures
      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData = await response.json() as { message?: string; error?: string };
          return {
            data: null,
            error: {
              message: errorData.message || errorData.error || `HTTP ${response.status}`,
            },
          };
        } catch {
          return {
            data: null,
            error: {
              message: `HTTP ${response.status}: ${response.statusText}`,
            },
          };
        }
      }

      // Parse successful response
      try {
        const data = await response.json() as T;
        return { data, error: null };
      } catch {
        // Some endpoints might return empty body
        return { data: null as T, error: null };
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  return {
    config: {
      baseURL,
      basePath,
    },

    signIn: {
      async email(credentials: SignInCredentials) {
        const result = await apiRequest<{
          user: BetterAuthUser;
          session: BetterAuthSession;
        }>("/sign-in/email", {
          method: "POST",
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        return {
          data: result.data,
          error: result.error,
        };
      },
    },

    signUp: {
      async email(credentials: SignUpCredentials) {
        const result = await apiRequest<{
          user: BetterAuthUser;
        }>("/sign-up/email", {
          method: "POST",
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            name: credentials.name,
          }),
        });

        return {
          data: result.data,
          error: result.error,
        };
      },
    },

    async signOut() {
      const result = await apiRequest<void>("/sign-out", {
        method: "POST",
      });

      return {
        error: result.error,
      };
    },

    async getSession() {
      const result = await apiRequest<{
        user: BetterAuthUser | null;
        session: BetterAuthSession | null;
      }>("/session");

      return {
        data: result.data,
        error: result.error,
      };
    },

    emailOtp: {
      async sendVerificationOtp(email: string, type: "sign-in" | "email-verification") {
        const result = await apiRequest<{ success: boolean }>("/email-otp/send-verification-otp", {
          method: "POST",
          body: JSON.stringify({
            email,
            type,
          }),
        });

        return {
          data: result.data,
          error: result.error,
        };
      },

      async verifyEmail(data: OtpVerificationData) {
        const result = await apiRequest<{
          user: BetterAuthUser;
          session: BetterAuthSession;
        }>("/email-otp/verify-email", {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            otp: data.otp,
          }),
        });

        return {
          data: result.data,
          error: result.error,
        };
      },
    },
  };
}
