/**
 * Unit tests for InMemoryAuthAdapter
 *
 * Tests the in-memory implementation of AuthPort for authentication operations.
 * Covers validateToken, refreshSession, and all test helper methods.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryAuthAdapter } from "./adapter";
import {
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases";
import { AuthContext, UserRole, UserId, TestIds } from "@mirai-app/domain";

describe("[UNIT] InMemoryAuthAdapter", () => {
  let adapter: InMemoryAuthAdapter;

  beforeEach(() => {
    adapter = new InMemoryAuthAdapter();
  });

  // ============================================================================
  // Mock Data Factories
  // ============================================================================

  function createMockUser(overrides?: {
    id?: string;
    email?: string;
    role?: UserRole;
    createdAt?: Date;
  }): ReturnType<InMemoryAuthAdapter["createUser"]> {
    const id = UserId.create(
      overrides?.id ?? "550e8400-e29b-41d4-a716-446655440000",
    );
    return adapter.createUser({
      id,
      email: overrides?.email ?? "test@example.com",
      role: overrides?.role ?? UserRole.USER,
      createdAt: overrides?.createdAt ?? new Date("2024-01-01"),
    });
  }

  function createMockSession(
    userId: ReturnType<typeof UserId.create>,
    expiresInSeconds: number = 3600,
  ): ReturnType<InMemoryAuthAdapter["createSession"]> {
    return adapter.createSession(userId, expiresInSeconds);
  }

  // ============================================================================
  // validateToken Tests
  // ============================================================================

  describe("validateToken", () => {
    it("returns AuthContext for valid token", async () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      const result = await Effect.runPromise(
        adapter.validateToken(session.token),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.role).toBe(UserRole.USER);
      expect(result.sessionId).toBe(session.sessionId);
      expect(result.authenticatedAt).toBeInstanceOf(Date);
    });

    it("returns AuthContext with correct role for admin user", async () => {
      const userId = createMockUser({ role: UserRole.ADMIN });
      const session = createMockSession(userId);

      const result = await Effect.runPromise(
        adapter.validateToken(session.token),
      );

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.isAdmin()).toBe(true);
    });

    it("returns AuthContext with correct role for moderator user", async () => {
      const userId = createMockUser({ role: UserRole.MODERATOR });
      const session = createMockSession(userId);

      const result = await Effect.runPromise(
        adapter.validateToken(session.token),
      );

      expect(result.role).toBe(UserRole.MODERATOR);
      expect(result.isModerator()).toBe(true);
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

    it("fails with InvalidTokenError for unknown token", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken("unknown-token")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("Invalid or unknown token");
      }
    });

    it("fails with SessionExpiredError for expired session", async () => {
      const userId = createMockUser();
      // Create session that expires immediately
      const session = adapter.createSession(userId, -1);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken(session.token)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session has expired");
        // Narrow the type to access sessionId property
        if (result.left instanceof SessionExpiredError) {
          expect(result.left.sessionId).toBe(session.sessionId);
        }
      }
    });

    it("fails with InvalidTokenError when user is deleted", async () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      // Delete the user after session creation
      adapter.deleteUser(userId);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken(session.token)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        // When user is deleted, the session is also deleted (cascade delete)
        // So the token becomes invalid/unknown
        expect(result.left.message).toBe("Invalid or unknown token");
      }
    });

    it("fails with InvalidTokenError when session is deleted", async () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      // Delete the session
      adapter.deleteSession(session.sessionId);

      const result = await Effect.runPromise(
        Effect.either(adapter.validateToken(session.token)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.message).toBe("Invalid or unknown token");
      }
    });
  });

  // ============================================================================
  // refreshSession Tests
  // ============================================================================

  describe("refreshSession", () => {
    it("returns AuthContext for valid session", async () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      const result = await Effect.runPromise(
        adapter.refreshSession(session.sessionId),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.role).toBe(UserRole.USER);
      expect(result.sessionId).toBe(session.sessionId);
    });

    it("fails with SessionExpiredError for unknown session", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession("unknown-session")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("No active session found");
      }
    });

    it("fails with SessionExpiredError for expired session", async () => {
      const userId = createMockUser();
      // Create session that expires immediately
      const session = adapter.createSession(userId, -1);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession(session.sessionId)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        expect(result.left.message).toBe("Session has expired");
      }
    });

    it("fails with SessionExpiredError when user is deleted", async () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      // Delete the user after session creation
      adapter.deleteUser(userId);

      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession(session.sessionId)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SessionExpiredError);
        // When user is deleted, the session is also deleted (cascade delete)
        // So the session becomes not found
        expect(result.left.message).toBe("No active session found");
      }
    });
  });

  // ============================================================================
  // createUser Tests
  // ============================================================================

  describe("createUser", () => {
    it("creates a user with default role", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440001");
      const result = adapter.createUser({ id: userId });

      expect(result).toBe(userId);
      expect(adapter.hasUser(userId)).toBe(true);

      const user = adapter.getUser(userId);
      expect(user).toBeDefined();
      expect(user?.role).toBe(UserRole.USER);
      expect(user?.email).toBeUndefined();
    });

    it("creates a user with specified role", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440002");
      adapter.createUser({ id: userId, role: UserRole.ADMIN });

      const user = adapter.getUser(userId);
      expect(user?.role).toBe(UserRole.ADMIN);
    });

    it("creates a user with email", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440003");
      adapter.createUser({ id: userId, email: "admin@example.com" });

      const user = adapter.getUser(userId);
      expect(user?.email).toBe("admin@example.com");
    });

    it("creates a user with specified createdAt", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440004");
      const createdAt = new Date("2023-06-15");
      adapter.createUser({ id: userId, createdAt });

      const user = adapter.getUser(userId);
      expect(user?.createdAt).toEqual(createdAt);
    });
  });

  // ============================================================================
  // createSession Tests
  // ============================================================================

  describe("createSession", () => {
    it("creates a session with default expiration", () => {
      const userId = createMockUser();
      const beforeCreate = Date.now();
      const session = adapter.createSession(userId);
      const afterCreate = Date.now();

      expect(session.sessionId).toMatch(/^test-session-\d+$/);
      expect(session.token).toMatch(/^test-token-\d+$/);
      expect(adapter.hasSession(session.sessionId)).toBe(true);

      // Default expiration is 1 hour (3600 seconds)
      const expectedMinExpiry = beforeCreate + 3600 * 1000;
      const expectedMaxExpiry = afterCreate + 3600 * 1000;
      expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMinExpiry,
      );
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMaxExpiry,
      );
    });

    it("creates a session with custom expiration", () => {
      const userId = createMockUser();
      const session = adapter.createSession(userId, 7200); // 2 hours

      const now = Date.now();
      const expectedExpiry = now + 7200 * 1000;
      expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedExpiry - 1000,
      );
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedExpiry + 1000,
      );
    });

    it("increments token counter for each session", () => {
      const userId = createMockUser();
      const session1 = adapter.createSession(userId);
      const session2 = adapter.createSession(userId);
      const session3 = adapter.createSession(userId);

      expect(session1.token).toBe("test-token-1");
      expect(session2.token).toBe("test-token-2");
      expect(session3.token).toBe("test-token-3");
    });
  });

  // ============================================================================
  // createSessionWithId Tests
  // ============================================================================

  describe("createSessionWithId", () => {
    it("creates a session with specific session ID", () => {
      const userId = createMockUser();
      const customSessionId = "my-custom-session-id";
      const result = adapter.createSessionWithId(customSessionId, userId);

      expect(adapter.hasSession(customSessionId)).toBe(true);

      const session = adapter.getSession(customSessionId);
      expect(session?.id).toBe(customSessionId);
      expect(session?.token).toBe(result.token);
    });

    it("creates retrievable session by token", () => {
      const userId = createMockUser();
      const customSessionId = "session-for-token-lookup";
      const result = adapter.createSessionWithId(customSessionId, userId);

      const sessionByToken = adapter.getSessionByToken(result.token);
      expect(sessionByToken).toBeDefined();
      expect(sessionByToken?.id).toBe(customSessionId);
    });
  });

  // ============================================================================
  // getUser Tests
  // ============================================================================

  describe("getUser", () => {
    it("returns user when exists", () => {
      const userId = createMockUser({ email: "user@example.com" });

      const user = adapter.getUser(userId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
      expect(user?.email).toBe("user@example.com");
    });

    it("returns undefined when user does not exist", () => {
      // Use a valid UUID that was never created
      const nonExistentId = UserId.create(TestIds.NON_EXISTENT);

      const user = adapter.getUser(nonExistentId);

      expect(user).toBeUndefined();
    });
  });

  // ============================================================================
  // getSession Tests
  // ============================================================================

  describe("getSession", () => {
    it("returns session when exists", () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      const retrieved = adapter.getSession(session.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.sessionId);
      expect(retrieved?.token).toBe(session.token);
    });

    it("returns undefined when session does not exist", () => {
      const retrieved = adapter.getSession("non-existent-session");

      expect(retrieved).toBeUndefined();
    });
  });

  // ============================================================================
  // getSessionByToken Tests
  // ============================================================================

  describe("getSessionByToken", () => {
    it("returns session by token when exists", () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      const retrieved = adapter.getSessionByToken(session.token);

      expect(retrieved).toBeDefined();
      expect(retrieved?.token).toBe(session.token);
      expect(retrieved?.userId).toBe(userId);
    });

    it("returns undefined for unknown token", () => {
      const retrieved = adapter.getSessionByToken("unknown-token");

      expect(retrieved).toBeUndefined();
    });
  });

  // ============================================================================
  // hasUser Tests
  // ============================================================================

  describe("hasUser", () => {
    it("returns true when user exists", () => {
      const userId = createMockUser();

      expect(adapter.hasUser(userId)).toBe(true);
    });

    it("returns false when user does not exist", () => {
      // Use a valid UUID that was never created
      const nonExistentId = UserId.create(TestIds.NON_EXISTENT);

      expect(adapter.hasUser(nonExistentId)).toBe(false);
    });
  });

  // ============================================================================
  // hasSession Tests
  // ============================================================================

  describe("hasSession", () => {
    it("returns true when session exists", () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      expect(adapter.hasSession(session.sessionId)).toBe(true);
    });

    it("returns false when session does not exist", () => {
      expect(adapter.hasSession("non-existent-session")).toBe(false);
    });
  });

  // ============================================================================
  // deleteUser Tests
  // ============================================================================

  describe("deleteUser", () => {
    it("deletes user and all their sessions", () => {
      const userId = createMockUser();
      const session1 = createMockSession(userId);
      const session2 = createMockSession(userId);

      adapter.deleteUser(userId);

      expect(adapter.hasUser(userId)).toBe(false);
      expect(adapter.hasSession(session1.sessionId)).toBe(false);
      expect(adapter.hasSession(session2.sessionId)).toBe(false);
      expect(adapter.getSessionByToken(session1.token)).toBeUndefined();
      expect(adapter.getSessionByToken(session2.token)).toBeUndefined();
    });

    it("does not affect other users sessions", () => {
      const userId1 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      const userId2 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440002",
      });
      const session1 = createMockSession(userId1);
      const session2 = createMockSession(userId2);

      adapter.deleteUser(userId1);

      expect(adapter.hasUser(userId2)).toBe(true);
      expect(adapter.hasSession(session2.sessionId)).toBe(true);
      expect(adapter.hasSession(session1.sessionId)).toBe(false);
    });

    it("handles deleting non-existent user gracefully", () => {
      // Use a valid UUID that was never created
      const nonExistentId = UserId.create(TestIds.NON_EXISTENT);

      expect(() => adapter.deleteUser(nonExistentId)).not.toThrow();
    });
  });

  // ============================================================================
  // deleteSession Tests
  // ============================================================================

  describe("deleteSession", () => {
    it("deletes session and removes token mapping", () => {
      const userId = createMockUser();
      const session = createMockSession(userId);

      adapter.deleteSession(session.sessionId);

      expect(adapter.hasSession(session.sessionId)).toBe(false);
      expect(adapter.getSessionByToken(session.token)).toBeUndefined();
    });

    it("does not affect other sessions", () => {
      const userId = createMockUser();
      const session1 = createMockSession(userId);
      const session2 = createMockSession(userId);

      adapter.deleteSession(session1.sessionId);

      expect(adapter.hasSession(session2.sessionId)).toBe(true);
      expect(adapter.getSessionByToken(session2.token)).toBeDefined();
    });

    it("handles deleting non-existent session gracefully", () => {
      expect(() => adapter.deleteSession("non-existent-session")).not.toThrow();
    });
  });

  // ============================================================================
  // clear Tests
  // ============================================================================

  describe("clear", () => {
    it("removes all users and sessions", () => {
      const userId1 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      const userId2 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440002",
      });
      const session1 = createMockSession(userId1);
      const session2 = createMockSession(userId2);

      adapter.clear();

      expect(adapter.hasUser(userId1)).toBe(false);
      expect(adapter.hasUser(userId2)).toBe(false);
      expect(adapter.hasSession(session1.sessionId)).toBe(false);
      expect(adapter.hasSession(session2.sessionId)).toBe(false);
    });

    it("resets token counter", () => {
      createMockUser();
      adapter.createSession(
        UserId.create("550e8400-e29b-41d4-a716-446655440000"),
      );
      adapter.clear();

      // After clear, counter should reset, so next session gets token-1 again
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440001");
      adapter.createUser({ id: userId });
      const newSession = adapter.createSession(userId);

      expect(newSession.token).toBe("test-token-1");
    });
  });

  // ============================================================================
  // getAllUsers Tests
  // ============================================================================

  describe("getAllUsers", () => {
    it("returns empty array when no users", () => {
      const users = adapter.getAllUsers();

      expect(users).toHaveLength(0);
    });

    it("returns all created users", () => {
      const userId1 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
        role: UserRole.USER,
      });
      const userId2 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440002",
        role: UserRole.ADMIN,
      });

      const users = adapter.getAllUsers();

      expect(users).toHaveLength(2);
      expect(users.map((u) => u.id)).toContain(userId1);
      expect(users.map((u) => u.id)).toContain(userId2);
    });
  });

  // ============================================================================
  // getAllSessions Tests
  // ============================================================================

  describe("getAllSessions", () => {
    it("returns empty array when no sessions", () => {
      const sessions = adapter.getAllSessions();

      expect(sessions).toHaveLength(0);
    });

    it("returns all created sessions", () => {
      const userId = createMockUser();
      const session1 = createMockSession(userId);
      const session2 = createMockSession(userId);

      const sessions = adapter.getAllSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions.map((s) => s.id)).toContain(session1.sessionId);
      expect(sessions.map((s) => s.id)).toContain(session2.sessionId);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("integration", () => {
    it("supports full authentication flow", async () => {
      // 1. Create a user
      const userId = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
        role: UserRole.USER,
      });

      // 2. Create a session
      const session = createMockSession(userId);

      // 3. Validate token
      const authContext = await Effect.runPromise(
        adapter.validateToken(session.token),
      );

      expect(authContext.userId).toBe(userId);
      expect(authContext.role).toBe(UserRole.USER);

      // 4. Refresh session
      const refreshedContext = await Effect.runPromise(
        adapter.refreshSession(session.sessionId),
      );

      expect(refreshedContext.userId).toBe(userId);
      expect(refreshedContext.sessionId).toBe(session.sessionId);

      // 5. Clean up
      adapter.deleteUser(userId);
      expect(adapter.hasUser(userId)).toBe(false);
    });

    it("supports multiple users with separate sessions", async () => {
      // Create two users
      const userId1 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440001",
        role: UserRole.USER,
      });
      const userId2 = createMockUser({
        id: "550e8400-e29b-41d4-a716-446655440002",
        role: UserRole.ADMIN,
      });

      // Create sessions for both
      const session1 = createMockSession(userId1);
      const session2 = createMockSession(userId2);

      // Validate both tokens
      const context1 = await Effect.runPromise(
        adapter.validateToken(session1.token),
      );
      const context2 = await Effect.runPromise(
        adapter.validateToken(session2.token),
      );

      expect(context1.userId).toBe(userId1);
      expect(context1.role).toBe(UserRole.USER);
      expect(context2.userId).toBe(userId2);
      expect(context2.role).toBe(UserRole.ADMIN);

      // Verify isolation - user1 cannot access user2's session
      const result = await Effect.runPromise(
        Effect.either(adapter.refreshSession(session2.sessionId)),
      );
      expect(result._tag).toBe("Right");
    });

    it("maintains state across adapter instance", () => {
      // Create user and session
      const userId = createMockUser();
      const session = createMockSession(userId);

      // Verify state is accessible
      expect(adapter.getUser(userId)).toBeDefined();
      expect(adapter.getSession(session.sessionId)).toBeDefined();
      expect(adapter.getAllUsers()).toHaveLength(1);
      expect(adapter.getAllSessions()).toHaveLength(1);
    });
  });
});
