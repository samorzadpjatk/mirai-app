import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SupabaseAuthAdapter } from "../auth/SupabaseAuthAdapter";
import {
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases/ports/AuthPort";
import { AuthContext, UserRole, UserId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import type {
  SupabaseClient,
  SupabaseUser,
} from "@mirai-app/frameworks/supabase";

describe("[INTEGRATION] SupabaseAuthAdapter", () => {
  // =============================================================================
  // Mock Factories
  // =============================================================================

  /**
   * Create a mock Supabase user with configurable properties
   */
  const createMockSupabaseUser = (
    overrides?: Partial<SupabaseUser>,
  ): SupabaseUser => {
    const defaultUser: SupabaseUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      email_confirmed_at: "2024-01-15T10:00:00Z",
      app_metadata: {},
      user_metadata: {},
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      aud: "authenticated",
      role: "authenticated",
    };

    return { ...defaultUser, ...overrides } as SupabaseUser;
  };

  /**
   * Create a mock Supabase client with configurable auth behavior
   */
  const createMockSupabaseClient = (config?: {
    getUserResult?: {
      data: { user: SupabaseUser | null };
      error: Error | null;
    };
    getSessionResult?: {
      data: { session: { access_token: string; expires_at?: number } | null };
      error: Error | null;
    };
  }) => {
    const mockGetUser = mock(() =>
      Promise.resolve(
        config?.getUserResult ?? {
          data: { user: createMockSupabaseUser() },
          error: null,
        },
      ),
    );

    const mockGetSession = mock(() =>
      Promise.resolve(
        config?.getSessionResult ?? {
          data: {
            session: {
              access_token: "valid-session-token",
              expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            },
          },
          error: null,
        },
      ),
    );

    return {
      auth: {
        getUser: mockGetUser,
        getSession: mockGetSession,
      },
    } as unknown as SupabaseClient;
  };

  // =============================================================================
  // Constructor Tests
  // =============================================================================

  describe("[UNIT] constructor", () => {
    it("should create adapter with injected SupabaseClient", () => {
      const mockSupabase = createMockSupabaseClient();
      const adapter = new SupabaseAuthAdapter(mockSupabase);

      expect(adapter).toBeDefined();
      expect(adapter.validateToken).toBeDefined();
      expect(adapter.refreshSession).toBeDefined();
    });
  });

  // =============================================================================
  // validateToken Tests
  // =============================================================================

  describe("[UNIT] validateToken", () => {
    it("should return AuthContext when token is valid", async () => {
      // Arrange
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@example.com",
        app_metadata: { role: "USER" },
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);
      const token = "valid-jwt-token";

      // Act
      const result = await adapter.validateToken(token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(token);

      if (Either.isRight(either)) {
        expect(either.right).toBeInstanceOf(AuthContext);
        expect(UserId.toString(either.right.userId)).toBe(
          "550e8400-e29b-41d4-a716-446655440001",
        );
        expect(either.right.role).toBe(UserRole.USER);
      }
    });

    it("should return AuthContext with ADMIN role when user is admin", async () => {
      // Arrange
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440002",
        app_metadata: { role: "ADMIN" },
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("admin-token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.ADMIN);
        expect(either.right.isAdmin()).toBe(true);
        expect(either.right.isModerator()).toBe(true);
      }
    });

    it("should return AuthContext with MODERATOR role when user is moderator", async () => {
      // Arrange
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440003",
        user_metadata: { role: "MODERATOR" },
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("moderator-token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.MODERATOR);
        expect(either.right.isAdmin()).toBe(false);
        expect(either.right.isModerator()).toBe(true);
      }
    });

    it("should extract role from app_metadata over user_metadata", async () => {
      // Arrange - app_metadata has ADMIN, user_metadata has USER
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440004",
        app_metadata: { role: "ADMIN" },
        user_metadata: { role: "USER" },
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert - should use app_metadata (ADMIN takes precedence)
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.ADMIN);
      }
    });

    it("should default to USER role when no role in metadata", async () => {
      // Arrange - no role in either metadata
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440005",
        app_metadata: {},
        user_metadata: {},
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.USER);
      }
    });

    it("should return InvalidTokenError when token is empty", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("Token cannot be empty");
        expect(either.left.code).toBe("INVALID_TOKEN");
      }
    });

    it("should return InvalidTokenError when token is whitespace only", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("   ");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("Token cannot be empty");
      }
    });

    it("should return InvalidTokenError when Supabase returns 401", async () => {
      // Arrange
      const authError = new Error("Invalid token");
      (authError as any).status = 401;

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: authError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("invalid-token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe(
          "Unauthorized: Invalid or expired token",
        );
      }
    });

    it("should return InvalidTokenError when user not found", async () => {
      // Arrange
      const notFoundError = new Error("User not found");
      (notFoundError as any).code = "user-not-found";

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: notFoundError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token-for-deleted-user");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("User not found");
      }
    });

    it("should return AuthError when user data is null but no error", async () => {
      // Arrange - valid response but no user
      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("valid-but-no-user");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("Token valid but user not found");
      }
    });

    it("should return AuthError when Supabase returns 403 (forbidden/banned)", async () => {
      // Arrange
      const forbiddenError = new Error("User is banned");
      (forbiddenError as any).status = 403;

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: forbiddenError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("banned-user-token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthError);
        expect(either.left.message).toBe(
          "Forbidden: User is banned or access denied",
        );
      }
    });

    it("should handle JWT expired error", async () => {
      // Arrange
      const expiredError = new Error("JWT expired");
      (expiredError as any).code = "jwt-expired";

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: expiredError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("expired-token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("JWT token has expired");
      }
    });

    it("should handle session missing error", async () => {
      // Arrange
      const sessionError = new Error("Session missing");
      (sessionError as any).code = "auth-session-missing";

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: sessionError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("session-missing");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("Session missing or invalid");
      }
    });

    it("should handle bad JWT format error", async () => {
      // Arrange
      const badJwtError = new Error("Invalid JWT");
      (badJwtError as any).code = "bad-jwt";

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: badJwtError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("malformed-jwt");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("Invalid JWT token format");
      }
    });

    it("should handle generic Supabase errors", async () => {
      // Arrange
      const serverError = new Error("Unexpected failure");

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: serverError },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("any-token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthError);
        expect(either.left.message).toContain("Authentication failed");
      }
    });

    it("should handle unexpected exceptions", async () => {
      // Arrange
      const mockSupabase = {
        auth: {
          getUser: mock(() => Promise.reject(new Error("Network failure"))),
        },
      } as unknown as SupabaseClient;

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthError);
        expect(either.left.message).toContain("Authentication failed");
      }
    });

    it("should handle non-Error exceptions", async () => {
      // Arrange
      const mockSupabase = {
        auth: {
          getUser: mock(() => Promise.reject("String error")),
        },
      } as unknown as SupabaseClient;

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthError);
      }
    });

    it("should use email_confirmed_at for authenticatedAt timestamp", async () => {
      // Arrange
      const confirmedAt = "2023-06-15T14:30:00Z";
      const mockUser = createMockSupabaseUser({
        email_confirmed_at: confirmedAt,
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        // Compare timestamps to handle both formats (with/without milliseconds)
        expect(either.right.authenticatedAt.getTime()).toBe(
          new Date(confirmedAt).getTime(),
        );
      }
    });

    it("should use current date when email_confirmed_at is missing", async () => {
      // Arrange
      const beforeTest = new Date();
      const mockUser = createMockSupabaseUser({
        email_confirmed_at: undefined,
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));
      const afterTest = new Date();

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.authenticatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeTest.getTime(),
        );
        expect(either.right.authenticatedAt.getTime()).toBeLessThanOrEqual(
          afterTest.getTime(),
        );
      }
    });

    it("should handle case-insensitive role values", async () => {
      // Arrange - lowercase role in metadata
      const mockUser = createMockSupabaseUser({
        app_metadata: { role: "admin" }, // lowercase
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert - should normalize to uppercase
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.ADMIN);
      }
    });
  });

  // =============================================================================
  // refreshSession Tests
  // =============================================================================

  describe("[UNIT] refreshSession", () => {
    it("should return AuthContext when session is valid", async () => {
      // Arrange
      const mockUser = createMockSupabaseUser({
        id: "550e8400-e29b-41d4-a716-446655440010",
        app_metadata: { role: "USER" },
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
        getSessionResult: {
          data: {
            session: {
              access_token: "session-access-token",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("session-123");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(
        "session-access-token",
      );

      if (Either.isRight(either)) {
        expect(UserId.toString(either.right.userId)).toBe(
          "550e8400-e29b-41d4-a716-446655440010",
        );
        expect(either.right.sessionId).toBe("session-123");
      }
    });

    it("should return SessionExpiredError when session is missing", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        getSessionResult: {
          data: { session: null },
          error: null,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("session-456");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("No active session found");
        expect(either.left.sessionId).toBe("session-456");
      }
    });

    it("should return SessionExpiredError when session has expired", async () => {
      // Arrange - session expired 1 hour ago
      const expiredAt = Math.floor(Date.now() / 1000) - 3600;

      // Create mock that fails token validation (simulating expired token)
      const expiredTokenError = new Error("JWT expired");
      (expiredTokenError as any).code = "jwt-expired";

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: expiredTokenError },
        getSessionResult: {
          data: {
            session: {
              access_token: "expired-token",
              expires_at: expiredAt,
            },
          },
          error: null,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("expired-session");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert - should get SessionExpiredError from validateToken path
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.sessionId).toBe("expired-session");
      }
    });

    it("should return SessionExpiredError when session has no access_token", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        getSessionResult: {
          data: {
            session: {
              access_token: "", // empty token
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("session-789");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("Session missing access token");
      }
    });

    it("should handle Supabase session errors", async () => {
      // Arrange
      const sessionError = new Error("Session invalid");
      (sessionError as any).code = "auth-session-missing";

      const mockSupabase = createMockSupabaseClient({
        getSessionResult: {
          data: { session: null },
          error: sessionError,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("invalid-session");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("Session missing or invalid");
      }
    });

    it("should handle unexpected errors during refresh", async () => {
      // Arrange
      const mockSupabase = {
        auth: {
          getSession: mock(() => Promise.reject(new Error("Network error"))),
        },
      } as unknown as SupabaseClient;

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("session-abc");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
      }
    });

    it("should propagate session ID in AuthContext on success", async () => {
      // Arrange
      const mockUser = createMockSupabaseUser();

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
        getSessionResult: {
          data: {
            session: {
              access_token: "token",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("my-session-id");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.sessionId).toBe("my-session-id");
      }
    });

    it("should treat validation errors as session expired", async () => {
      // Arrange - session exists but token validation fails
      const validationError = new Error("Invalid token");
      (validationError as any).status = 401;

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: null }, error: validationError },
        getSessionResult: {
          data: {
            session: {
              access_token: "invalid-session-token",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.refreshSession("session-xyz");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert - should wrap in SessionExpiredError
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toContain("Unauthorized");
      }
    });
  });

  // =============================================================================
  // Error Type Consistency Tests
  // =============================================================================

  describe("[UNIT] error type consistency", () => {
    it("should use correct error tags for all error types", async () => {
      const mockSupabase = createMockSupabaseClient({
        getUserResult: {
          data: { user: null },
          error: new Error("Generic error"),
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left._tag).toBe("AuthError");
        expect(either.left.code).toBe("AUTH_ERROR");
      }
    });

    it("should preserve original error cause for debugging", async () => {
      const originalError = new Error("Original Supabase error");

      const mockSupabase = createMockSupabaseClient({
        getUserResult: {
          data: { user: null },
          error: originalError,
        },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        // Check that error message contains original error info
        expect(either.left.message).toContain("Original Supabase error");
      }
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe("[UNIT] edge cases", () => {
    it("should handle user with missing id field", async () => {
      // Arrange - user without id (shouldn't happen but handle gracefully)
      const mockUser = {
        ...createMockSupabaseUser(),
        id: undefined,
      } as unknown as SupabaseUser;

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthError);
        expect(either.left.message).toContain("missing required ID");
      }
    });

    it("should handle role edge cases gracefully", async () => {
      // Arrange - unknown role value
      const mockUser = createMockSupabaseUser({
        app_metadata: { role: "SUPER_ADMIN" }, // Not in our enum
      });

      const mockSupabase = createMockSupabaseClient({
        getUserResult: { data: { user: mockUser }, error: null },
      });

      const adapter = new SupabaseAuthAdapter(mockSupabase);

      // Act
      const result = await adapter.validateToken("token");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert - should default to USER
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.USER);
      }
    });

    it("should handle various JWT error codes", async () => {
      const jwtErrors = [
        {
          code: "jwt-invalid-claims",
          expectedMessage: "JWT token has invalid claims",
        },
        {
          code: "jwt-invalid-signature",
          expectedMessage: "JWT signature is invalid",
        },
        {
          code: "jwt-invalid-audience",
          expectedMessage: "JWT audience is invalid",
        },
        {
          code: "jwt-invalid-issuer",
          expectedMessage: "JWT issuer is invalid",
        },
      ];

      for (const { code, expectedMessage } of jwtErrors) {
        const jwtError = new Error("JWT error");
        (jwtError as any).code = code;

        const mockSupabase = createMockSupabaseClient({
          getUserResult: { data: { user: null }, error: jwtError },
        });

        const adapter = new SupabaseAuthAdapter(mockSupabase);
        const result = await adapter.validateToken("token");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(InvalidTokenError);
          expect(either.left.message).toBe(expectedMessage);
        }
      }
    });
  });
});
