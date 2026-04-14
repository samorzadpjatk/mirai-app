import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryAuthAdapter } from "../auth/InMemoryAuthAdapter";
import {
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases/ports/AuthPort";
import { AuthContext, UserRole, UserId } from "@mirai-app/domain";
import { Effect, Either } from "effect";

describe("[UNIT] InMemoryAuthAdapter", () => {
  let adapter: InMemoryAuthAdapter;

  beforeEach(() => {
    adapter = new InMemoryAuthAdapter();
  });

  // =============================================================================
  // Constructor Tests
  // =============================================================================

  describe("constructor", () => {
    it("should create adapter with empty state", () => {
      const newAdapter = new InMemoryAuthAdapter();

      expect(newAdapter).toBeDefined();
      expect(newAdapter.validateToken).toBeDefined();
      expect(newAdapter.refreshSession).toBeDefined();
    });
  });

  // =============================================================================
  // validateToken Tests
  // =============================================================================

  describe("validateToken", () => {
    it("should return AuthContext when token is valid", async () => {
      // Arrange
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440001");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);

      // Act
      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
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
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440002");
      adapter.createUser({ id: userId, role: UserRole.ADMIN });
      const session = adapter.createSession(userId);

      // Act
      const result = await adapter.validateToken(session.token);
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
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440003");
      adapter.createUser({ id: userId, role: UserRole.MODERATOR });
      const session = adapter.createSession(userId);

      // Act
      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.role).toBe(UserRole.MODERATOR);
        expect(either.right.isAdmin()).toBe(false);
        expect(either.right.isModerator()).toBe(true);
      }
    });

    it("should return InvalidTokenError when token is empty", async () => {
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

    it("should return InvalidTokenError for unknown token", async () => {
      // Act
      const result = await adapter.validateToken("unknown-token-123");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("Invalid or unknown token");
        if (either.left._tag === "InvalidTokenError") {
          expect(either.left.token).toBe("unknown-token-123");
        }
      }
    });

    it("should return InvalidTokenError when user not found", async () => {
      // Arrange - create session then delete only the user (keep session)
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440004");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);
      // Use deleteSession first, then recreate it after user deletion
      // to simulate orphaned session scenario
      const sessionData = adapter.getSession(session.sessionId);
      (adapter as any).users.delete(UserId.toString(userId)); // Directly delete user only

      // Act
      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidTokenError);
        expect(either.left.message).toBe("User not found");
      }
    });

    it("should return SessionExpiredError when session has expired", async () => {
      // Arrange - create expired session
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440005");
      adapter.createUser({ id: userId, role: UserRole.USER });

      // Create session that expires immediately
      const session = adapter.createSession(userId, -1); // Already expired

      // Act
      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("Session has expired");
        if (either.left._tag === "SessionExpiredError") {
          expect(either.left.sessionId).toBe(session.sessionId);
        }
      }
    });

    it("should include session ID in AuthContext on success", async () => {
      // Arrange
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440006");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);

      // Act
      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.sessionId).toBe(session.sessionId);
      }
    });

    it("should include authenticatedAt timestamp in AuthContext", async () => {
      // Arrange
      const beforeCreate = new Date();
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440007");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);
      const afterCreate = new Date();

      // Act
      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.authenticatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime(),
        );
        expect(either.right.authenticatedAt.getTime()).toBeLessThanOrEqual(
          afterCreate.getTime(),
        );
      }
    });
  });

  // =============================================================================
  // refreshSession Tests
  // =============================================================================

  describe("refreshSession", () => {
    it("should return AuthContext when session is valid", async () => {
      // Arrange
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440010");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);

      // Act
      const result = await adapter.refreshSession(session.sessionId);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(UserId.toString(either.right.userId)).toBe(
          "550e8400-e29b-41d4-a716-446655440010",
        );
        expect(either.right.sessionId).toBe(session.sessionId);
      }
    });

    it("should return SessionExpiredError when session is missing", async () => {
      // Act
      const result = await adapter.refreshSession("non-existent-session");
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("No active session found");
        if (either.left._tag === "SessionExpiredError") {
          expect(either.left.sessionId).toBe("non-existent-session");
        }
      }
    });

    it("should return SessionExpiredError when session has expired", async () => {
      // Arrange - create expired session
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440011");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId, -1); // Already expired

      // Act
      const result = await adapter.refreshSession(session.sessionId);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("Session has expired");
        if (either.left._tag === "SessionExpiredError") {
          expect(either.left.sessionId).toBe(session.sessionId);
        }
      }
    });

    it("should return SessionExpiredError when user not found", async () => {
      // Arrange - create session then delete only the user (keep session)
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440012");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);
      // Directly delete user only to simulate orphaned session scenario
      (adapter as any).users.delete(UserId.toString(userId));

      // Act
      const result = await adapter.refreshSession(session.sessionId);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left.message).toBe("User not found");
      }
    });

    it("should propagate session ID in AuthContext on success", async () => {
      // Arrange
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440013");
      adapter.createUser({ id: userId, role: UserRole.USER });
      const session = adapter.createSession(userId);

      // Act
      const result = await adapter.refreshSession(session.sessionId);
      const either = await Effect.runPromise(Effect.either(result));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.sessionId).toBe(session.sessionId);
      }
    });
  });

  // =============================================================================
  // Test Helper Methods
  // =============================================================================

  describe("createUser", () => {
    it("should create a user with default USER role", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440020");

      const result = adapter.createUser({ id: userId });

      expect(result).toBe(userId);
      const user = adapter.getUser(userId);
      expect(user).toBeDefined();
      expect(user!.role).toBe(UserRole.USER);
    });

    it("should create a user with specified role", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440021");

      adapter.createUser({ id: userId, role: UserRole.ADMIN });

      const user = adapter.getUser(userId);
      expect(user!.role).toBe(UserRole.ADMIN);
    });

    it("should create a user with email", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440022");

      adapter.createUser({ id: userId, email: "test@example.com" });

      const user = adapter.getUser(userId);
      expect(user!.email).toBe("test@example.com");
    });

    it("should create a user with specified createdAt", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440023");
      const createdAt = new Date("2024-01-15T10:00:00Z");

      adapter.createUser({ id: userId, createdAt });

      const user = adapter.getUser(userId);
      expect(user!.createdAt).toBe(createdAt);
    });
  });

  describe("createSession", () => {
    it("should create a session with default expiration", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440030");
      adapter.createUser({ id: userId });

      const before = new Date();
      const session = adapter.createSession(userId);
      const after = new Date();

      expect(session.sessionId).toMatch(/^test-session-\d+$/);
      expect(session.token).toMatch(/^test-token-\d+$/);
      expect(session.expiresAt.getTime()).toBeGreaterThan(
        before.getTime() + 3500 * 1000,
      );
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
        after.getTime() + 3600 * 1000,
      );
    });

    it("should create a session with custom expiration", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440031");
      adapter.createUser({ id: userId });

      const session = adapter.createSession(userId, 7200);

      expect(session.token).toMatch(/^test-token-\d+$/);
    });

    it("should generate unique tokens for each session", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440032");
      adapter.createUser({ id: userId });

      const session1 = adapter.createSession(userId);
      const session2 = adapter.createSession(userId);

      expect(session1.token).not.toBe(session2.token);
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe("createSessionWithId", () => {
    it("should create a session with specific ID", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440040");
      adapter.createUser({ id: userId });

      const result = adapter.createSessionWithId("my-custom-session", userId);

      expect(result.token).toMatch(/^test-token-\d+$/);
      const session = adapter.getSession("my-custom-session");
      expect(session).toBeDefined();
      expect(UserId.toString(session!.userId)).toBe(
        "550e8400-e29b-41d4-a716-446655440040",
      );
    });
  });

  describe("getUser", () => {
    it("should return undefined for non-existent user", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440050");

      const user = adapter.getUser(userId);

      expect(user).toBeUndefined();
    });

    it("should return user for existing user", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440051");
      adapter.createUser({ id: userId, role: UserRole.ADMIN });

      const user = adapter.getUser(userId);

      expect(user).toBeDefined();
      expect(user!.role).toBe(UserRole.ADMIN);
    });
  });

  describe("getSession", () => {
    it("should return undefined for non-existent session", () => {
      const session = adapter.getSession("non-existent");

      expect(session).toBeUndefined();
    });

    it("should return session for existing session", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440060");
      adapter.createUser({ id: userId });
      const { sessionId } = adapter.createSession(userId);

      const session = adapter.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session!.id).toBe(sessionId);
    });
  });

  describe("getSessionByToken", () => {
    it("should return session by token", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440070");
      adapter.createUser({ id: userId });
      const { token, sessionId } = adapter.createSession(userId);

      const session = adapter.getSessionByToken(token);

      expect(session).toBeDefined();
      expect(session!.id).toBe(sessionId);
    });

    it("should return undefined for unknown token", () => {
      const session = adapter.getSessionByToken("unknown-token");

      expect(session).toBeUndefined();
    });
  });

  describe("hasUser", () => {
    it("should return false for non-existent user", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440080");

      expect(adapter.hasUser(userId)).toBe(false);
    });

    it("should return true for existing user", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440081");
      adapter.createUser({ id: userId });

      expect(adapter.hasUser(userId)).toBe(true);
    });
  });

  describe("hasSession", () => {
    it("should return false for non-existent session", () => {
      expect(adapter.hasSession("non-existent")).toBe(false);
    });

    it("should return true for existing session", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440090");
      adapter.createUser({ id: userId });
      const { sessionId } = adapter.createSession(userId);

      expect(adapter.hasSession(sessionId)).toBe(true);
    });
  });

  describe("deleteUser", () => {
    it("should delete user and all their sessions", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440100");
      adapter.createUser({ id: userId });
      const { sessionId, token } = adapter.createSession(userId);

      adapter.deleteUser(userId);

      expect(adapter.hasUser(userId)).toBe(false);
      expect(adapter.hasSession(sessionId)).toBe(false);
      expect(adapter.getSessionByToken(token)).toBeUndefined();
    });

    it("should handle deleting non-existent user gracefully", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440101");

      // Should not throw
      adapter.deleteUser(userId);

      expect(adapter.hasUser(userId)).toBe(false);
    });

    it("should only delete sessions for specified user", () => {
      const userId1 = UserId.create("550e8400-e29b-41d4-a716-446655440102");
      const userId2 = UserId.create("550e8400-e29b-41d4-a716-446655440103");
      adapter.createUser({ id: userId1 });
      adapter.createUser({ id: userId2 });
      const session1 = adapter.createSession(userId1);
      const session2 = adapter.createSession(userId2);

      adapter.deleteUser(userId1);

      expect(adapter.hasUser(userId1)).toBe(false);
      expect(adapter.hasUser(userId2)).toBe(true);
      expect(adapter.hasSession(session1.sessionId)).toBe(false);
      expect(adapter.hasSession(session2.sessionId)).toBe(true);
    });
  });

  describe("deleteSession", () => {
    it("should delete session and its token mapping", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440110");
      adapter.createUser({ id: userId });
      const { sessionId, token } = adapter.createSession(userId);

      adapter.deleteSession(sessionId);

      expect(adapter.hasSession(sessionId)).toBe(false);
      expect(adapter.getSessionByToken(token)).toBeUndefined();
    });

    it("should handle deleting non-existent session gracefully", () => {
      // Should not throw
      adapter.deleteSession("non-existent");
    });
  });

  describe("clear", () => {
    it("should clear all users and sessions", () => {
      const userId1 = UserId.create("550e8400-e29b-41d4-a716-446655440120");
      const userId2 = UserId.create("550e8400-e29b-41d4-a716-446655440121");
      adapter.createUser({ id: userId1 });
      adapter.createUser({ id: userId2 });
      adapter.createSession(userId1);
      adapter.createSession(userId2);

      adapter.clear();

      expect(adapter.hasUser(userId1)).toBe(false);
      expect(adapter.hasUser(userId2)).toBe(false);
      expect(adapter.getAllUsers()).toHaveLength(0);
      expect(adapter.getAllSessions()).toHaveLength(0);
    });

    it("should reset token counter", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440122");
      adapter.createUser({ id: userId });
      adapter.createSession(userId);
      adapter.createSession(userId);

      adapter.clear();

      const userId2 = UserId.create("550e8400-e29b-41d4-a716-446655440123");
      adapter.createUser({ id: userId2 });
      const session = adapter.createSession(userId2);

      // Should start from 1 again after clear
      expect(session.token).toBe("test-token-1");
    });
  });

  describe("getAllUsers", () => {
    it("should return empty array when no users", () => {
      const users = adapter.getAllUsers();

      expect(users).toHaveLength(0);
    });

    it("should return all users", () => {
      const userId1 = UserId.create("550e8400-e29b-41d4-a716-446655440130");
      const userId2 = UserId.create("550e8400-e29b-41d4-a716-446655440131");
      adapter.createUser({ id: userId1 });
      adapter.createUser({ id: userId2 });

      const users = adapter.getAllUsers();

      expect(users).toHaveLength(2);
    });
  });

  describe("getAllSessions", () => {
    it("should return empty array when no sessions", () => {
      const sessions = adapter.getAllSessions();

      expect(sessions).toHaveLength(0);
    });

    it("should return all sessions", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440140");
      adapter.createUser({ id: userId });
      adapter.createSession(userId);
      adapter.createSession(userId);

      const sessions = adapter.getAllSessions();

      expect(sessions).toHaveLength(2);
    });
  });

  // =============================================================================
  // Error Type Consistency Tests
  // =============================================================================

  describe("error type consistency", () => {
    it("should use correct error tags for all error types", async () => {
      // InvalidTokenError
      const invalidTokenResult = await adapter.validateToken("unknown");
      const invalidTokenEither = await Effect.runPromise(
        Effect.either(invalidTokenResult),
      );
      expect(Either.isLeft(invalidTokenEither)).toBe(true);
      if (Either.isLeft(invalidTokenEither)) {
        expect(invalidTokenEither.left._tag).toBe("InvalidTokenError");
        expect(invalidTokenEither.left.code).toBe("INVALID_TOKEN");
      }

      // SessionExpiredError
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440150");
      adapter.createUser({ id: userId });
      const session = adapter.createSession(userId, -1);
      const expiredResult = await adapter.validateToken(session.token);
      const expiredEither = await Effect.runPromise(
        Effect.either(expiredResult),
      );
      expect(Either.isLeft(expiredEither)).toBe(true);
      if (Either.isLeft(expiredEither)) {
        expect(expiredEither.left._tag).toBe("SessionExpiredError");
        expect(expiredEither.left.code).toBe("SESSION_EXPIRED");
      }
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe("edge cases", () => {
    it("should handle multiple users with different roles", async () => {
      const adminId = UserId.create("550e8400-e29b-41d4-a716-446655440160");
      const modId = UserId.create("550e8400-e29b-41d4-a716-446655440161");
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440162");

      adapter.createUser({ id: adminId, role: UserRole.ADMIN });
      adapter.createUser({ id: modId, role: UserRole.MODERATOR });
      adapter.createUser({ id: userId, role: UserRole.USER });

      const adminSession = adapter.createSession(adminId);
      const modSession = adapter.createSession(modId);
      const userSession = adapter.createSession(userId);

      const adminResult = await adapter.validateToken(adminSession.token);
      const modResult = await adapter.validateToken(modSession.token);
      const userResult = await adapter.validateToken(userSession.token);

      const adminEither = await Effect.runPromise(Effect.either(adminResult));
      const modEither = await Effect.runPromise(Effect.either(modResult));
      const userEither = await Effect.runPromise(Effect.either(userResult));

      expect(Either.isRight(adminEither) && adminEither.right.role).toBe(
        UserRole.ADMIN,
      );
      expect(Either.isRight(modEither) && modEither.right.role).toBe(
        UserRole.MODERATOR,
      );
      expect(Either.isRight(userEither) && userEither.right.role).toBe(
        UserRole.USER,
      );
    });

    it("should handle multiple sessions for same user", async () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440170");
      adapter.createUser({ id: userId });

      const session1 = adapter.createSession(userId);
      const session2 = adapter.createSession(userId);

      const result1 = await adapter.validateToken(session1.token);
      const result2 = await adapter.validateToken(session2.token);

      const either1 = await Effect.runPromise(Effect.either(result1));
      const either2 = await Effect.runPromise(Effect.either(result2));

      expect(Either.isRight(either1)).toBe(true);
      expect(Either.isRight(either2)).toBe(true);
      if (Either.isRight(either1) && Either.isRight(either2)) {
        expect(either1.right.sessionId).not.toBe(either2.right.sessionId);
      }
    });

    it("should handle token format validation", async () => {
      // Tokens with special characters should still work
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440180");
      adapter.createUser({ id: userId });
      const session = adapter.createSession(userId);

      // The generated token should match expected pattern
      expect(session.token).toMatch(/^test-token-\d+$/);
    });

    it("should maintain state isolation between instances", async () => {
      const adapter1 = new InMemoryAuthAdapter();
      const adapter2 = new InMemoryAuthAdapter();

      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440190");
      adapter1.createUser({ id: userId });
      const session = adapter1.createSession(userId);

      // adapter2 should not see adapter1's state
      expect(adapter2.hasUser(userId)).toBe(false);
      const result = await adapter2.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));
      expect(Either.isLeft(either)).toBe(true);
    });

    it("should handle beforeEach cleanup correctly", async () => {
      // This test relies on beforeEach clearing state
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440200");
      adapter.createUser({ id: userId });
      const session = adapter.createSession(userId);

      const result = await adapter.validateToken(session.token);
      const either = await Effect.runPromise(Effect.either(result));
      expect(Either.isRight(either)).toBe(true);
    });
  });
});
