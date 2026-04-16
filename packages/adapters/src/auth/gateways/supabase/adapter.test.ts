/**
 * Unit tests for SupabaseAuthAdapter
 *
 * Tests the Supabase Auth implementation of AuthPort for authentication operations.
 * Covers validateToken, refreshSession, error mapping, and role extraction.
 *
 * ## Summary
 *
 * - validateToken: Token validation with Supabase Auth, error mapping, role extraction
 * - refreshSession: Session refresh with expiration checks, token validation delegation
 * - mapSupabaseErrorToAuthError: Error code mapping (jwt-expired, bad-jwt, etc.)
 * - extractRoleFromSupabaseUser: Role extraction from app_metadata and user_metadata
 * - mapSupabaseUserToAuthContext: User mapping with branded ID creation
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { SupabaseAuthAdapter } from "./adapter";
import {
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases";
import { UserRole } from "@mirai-app/domain";
import type {
  SupabaseClient,
  SupabaseUser,
} from "@mirai-app/frameworks/supabase";

describe("[UNIT] SupabaseAuthAdapter", () => {
  let adapter: SupabaseAuthAdapter;
  let mockSupabaseClient: SupabaseClient;

  // ============================================================================
  // Mock Factories
  // ============================================================================

  function createMockSupabaseUser(
    overrides: Partial<SupabaseUser> = {},
  ): SupabaseUser {
    return {
      id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
      email: overrides.email ?? "test@example.com",
      user_metadata: overrides.user_metadata ?? {},
      app_metadata: overrides.app_metadata ?? {},
      email_confirmed_at:
        overrides.email_confirmed_at !== undefined
          ? overrides.email_confirmed_at
          : new Date().toISOString(),
      phone: overrides.phone ?? null,
      created_at: overrides.created_at ?? new Date().toISOString(),
      updated_at: overrides.updated_at ?? new Date().toISOString(),
    } as SupabaseUser;
  }

  function createMockSupabaseClient(
    options: {
      user?: SupabaseUser | null;
      getUserError?: {
        code?: string;
        status?: number;
        message?: string;
      } | null;
      session?: {
        user: SupabaseUser;
        access_token: string;
        refresh_token: string | null;
        token_type: string;
        expires_in: number | null;
        expires_at: number | null;
      } | null;
      getSessionError?: {
        code?: string;
        status?: number;
        message?: string;
      } | null;
    } = {},
  ): SupabaseClient {
    return {
      auth: {
        getUser: async (_token?: string) => {
          if (options.getUserError) {
            const error = new Error(
              options.getUserError.message ?? "Auth error",
            );
            if (options.getUserError.code) {
              (error as { code?: string }).code = options.getUserError.code;
            }
            if (options.getUserError.status) {
              (error as { status?: number }).status =
                options.getUserError.status;
            }
            return { data: { user: null }, error };
          }
          return {
            data: { user: options.user ?? null },
            error: null,
          };
        },
        getSession: async () => {
          if (options.getSessionError) {
            const error = new Error(
              options.getSessionError.message ?? "Session error",
            );
            if (options.getSessionError.code) {
              (error as { code?: string }).code = options.getSessionError.code;
            }
            if (options.getSessionError.status) {
              (error as { status?: number }).status =
                options.getSessionError.status;
            }
            return { data: { session: null }, error };
          }
          return {
            data: { session: options.session ?? null },
            error: null,
          };
        },
      },
    } as unknown as SupabaseClient;
  }

  // ============================================================================
  // validateToken Tests
  // ============================================================================

  describe("validateToken", () => {
    beforeEach(() => {
      mockSupabaseClient = createMockSupabaseClient();
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);
    });

    it("returns AuthContext for valid token", async () => {
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@example.com",
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result).toBeDefined();
      expect(result.role).toBe(UserRole.USER);
      expect(result.authenticatedAt).toBeInstanceOf(Date);
      expect(result.sessionId).toBeUndefined();
    });

    it("extracts ADMIN role from app_metadata", async () => {
      const mockUser = createMockSupabaseUser({
        app_metadata: { role: "admin" },
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.isAdmin()).toBe(true);
    });

    it("extracts MODERATOR role from user_metadata", async () => {
      const mockUser = createMockSupabaseUser({
        user_metadata: { role: "moderator" },
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result.role).toBe(UserRole.MODERATOR);
      expect(result.isModerator()).toBe(true);
    });

    it("extracts USER role from app_metadata when lowercase", async () => {
      const mockUser = createMockSupabaseUser({
        app_metadata: { role: "user" },
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result.role).toBe(UserRole.USER);
    });

    it("defaults to USER role when no role metadata", async () => {
      const mockUser = createMockSupabaseUser();
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result.role).toBe(UserRole.USER);
    });

    it("fails with InvalidTokenError for empty token", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("Token cannot be empty");
      }
    });

    it("fails with InvalidTokenError for whitespace-only token", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("   ")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("Token cannot be empty");
      }
    });

    it("fails with InvalidTokenError for null token", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("" as unknown as string)),
      );

      expect(result._tag).toBe("Left");
    });

    it("fails with SessionExpiredError for jwt-expired error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { code: "jwt-expired", message: "JWT expired" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("expired-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("JWT token has expired");
      }
    });

    it("fails with SessionExpiredError for auth-session-missing error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { code: "auth-session-missing", message: "No session" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("missing-session-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session missing or invalid");
      }
    });

    it("fails with InvalidTokenError for bad-jwt error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { code: "bad-jwt", message: "Bad JWT" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("bad-jwt-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("Invalid JWT token format");
      }
    });

    it("fails with InvalidTokenError for jwt-invalid-signature error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { code: "jwt-invalid-signature" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("invalid-sig-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
      }
    });

    it("fails with InvalidTokenError for user-not-found error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { code: "user-not-found" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("valid-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("User not found");
      }
    });

    it("fails with InvalidTokenError for HTTP 401 status", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { status: 401, message: "Unauthorized" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("unauthorized-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe(
          "Unauthorized: Invalid or expired token",
        );
      }
    });

    it("fails with AuthError for HTTP 403 status", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { status: 403, message: "Forbidden" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("forbidden-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AuthError);
        expect(result.left.message).toBe(
          "Forbidden: User is banned or access denied",
        );
      }
    });

    it("fails with InvalidTokenError when Supabase returns null user", async () => {
      mockSupabaseClient = createMockSupabaseClient({ user: null });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("valid-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("Token valid but user not found");
      }
    });

    it("fails with AuthError for unexpected-failure error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getUserError: { code: "unexpected-failure", message: "Unexpected" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("error-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AuthError);
      }
    });

    it("fails with AuthError for generic Error", async () => {
      mockSupabaseClient = {
        auth: {
          getUser: async () => {
            throw new Error("Network error");
          },
        },
      } as unknown as SupabaseClient;
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("network-error-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AuthError);
        expect(result.left.message).toContain("Authentication failed");
      }
    });

    it("fails with AuthError for non-Error thrown", async () => {
      mockSupabaseClient = {
        auth: {
          getUser: async () => {
            throw "string error";
          },
        },
      } as unknown as SupabaseClient;
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("error-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AuthError);
      }
    });

    it("uses email_confirmed_at for authenticatedAt when available", async () => {
      const confirmedAt = "2024-01-15T10:30:00.000Z";
      const mockUser = createMockSupabaseUser({
        email_confirmed_at: confirmedAt,
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result.authenticatedAt).toEqual(new Date(confirmedAt));
    });

    it("uses current date for authenticatedAt when email_confirmed_at is null", async () => {
      const mockUser = createMockSupabaseUser({
        email_confirmed_at: null as unknown as undefined,
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const beforeTest = Date.now();
      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );
      const afterTest = Date.now();

      expect(result.authenticatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTest,
      );
      expect(result.authenticatedAt.getTime()).toBeLessThanOrEqual(afterTest);
    });
  });

  // ============================================================================
  // refreshSession Tests
  // ============================================================================

  describe("refreshSession", () => {
    beforeEach(() => {
      mockSupabaseClient = createMockSupabaseClient();
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);
    });

    it("returns AuthContext for valid session", async () => {
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      mockSupabaseClient = createMockSupabaseClient({
        user: mockUser,
        session: {
          user: mockUser,
          access_token: "session-access-token",
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: futureExp,
        },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.refreshSession("session-123"),
      );

      expect(result).toBeDefined();
      expect(result.sessionId).toBe("session-123");
      expect(result.role).toBe(UserRole.USER);
    });

    it("fails with SessionExpiredError when no active session", async () => {
      mockSupabaseClient = createMockSupabaseClient({ session: null });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("No active session found");
      }
    });

    it("fails with SessionExpiredError when session has expired", async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockUser = createMockSupabaseUser();
      mockSupabaseClient = createMockSupabaseClient({
        session: {
          user: mockUser,
          access_token: "expired-token",
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_in: 0,
          expires_at: pastExp,
        },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session has expired");
      }
    });

    it("fails with SessionExpiredError when session missing access_token", async () => {
      const mockUser = createMockSupabaseUser();
      mockSupabaseClient = createMockSupabaseClient({
        session: {
          user: mockUser,
          access_token: "", // Empty access token
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session missing access token");
      }
    });

    it("fails with SessionExpiredError for getSession error", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getSessionError: {
          code: "auth-session-missing",
          message: "No session",
        },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session missing or invalid");
      }
    });

    it("maps generic getSession error to SessionExpiredError", async () => {
      mockSupabaseClient = createMockSupabaseClient({
        getSessionError: { message: "Server error", status: 500 },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toContain("Authentication failed");
      }
    });

    it("fails when validateToken fails during refresh", async () => {
      const mockUser = createMockSupabaseUser();
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      mockSupabaseClient = createMockSupabaseClient({
        session: {
          user: mockUser,
          access_token: "bad-token",
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: futureExp,
        },
        // When validateToken tries to use the access_token, it will fail
        getUserError: { code: "bad-jwt" },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
      }
    });

    it("handles exception during getSession", async () => {
      mockSupabaseClient = {
        auth: {
          getSession: async () => {
            throw new Error("Network error");
          },
        },
      } as unknown as SupabaseClient;
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Network error");
      }
    });

    it("handles non-Error exception during getSession", async () => {
      mockSupabaseClient = {
        auth: {
          getSession: async () => {
            throw "string error";
          },
        },
      } as unknown as SupabaseClient;
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("session-123")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session refresh failed");
      }
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("integration", () => {
    it("supports full authentication flow", async () => {
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@example.com",
        app_metadata: { role: "admin" },
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      // Step 1: Validate token
      const authContext = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );
      expect(authContext.role).toBe(UserRole.ADMIN);
      expect(authContext.isAdmin()).toBe(true);

      // Step 2: Refresh session (simulate new session)
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      mockSupabaseClient = createMockSupabaseClient({
        user: mockUser,
        session: {
          user: mockUser,
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: futureExp,
        },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const refreshedContext = await Effect.runPromise(
        adapter.refreshSession("session-456"),
      );
      expect(refreshedContext.sessionId).toBe("session-456");
      expect(refreshedContext.role).toBe(UserRole.ADMIN);
    });

    it("preserves sessionId through refresh flow", async () => {
      const mockUser = createMockSupabaseUser();
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      mockSupabaseClient = createMockSupabaseClient({
        user: mockUser,
        session: {
          user: mockUser,
          access_token: "access-token",
          refresh_token: "refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: futureExp,
        },
      });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const sessionId = "my-custom-session-id";
      const result = await Effect.runPromise(adapter.refreshSession(sessionId));

      expect(result.sessionId).toBe(sessionId);
    });

    it("handles role priority correctly (app_metadata over user_metadata)", async () => {
      const mockUser = createMockSupabaseUser({
        app_metadata: { role: "moderator" },
        user_metadata: { role: "admin" }, // Should be ignored
      });
      mockSupabaseClient = createMockSupabaseClient({ user: mockUser });
      adapter = new SupabaseAuthAdapter(mockSupabaseClient);

      const result = await Effect.runPromise(
        adapter.validateToken("valid-token"),
      );

      expect(result.role).toBe(UserRole.MODERATOR);
    });
  });
});
