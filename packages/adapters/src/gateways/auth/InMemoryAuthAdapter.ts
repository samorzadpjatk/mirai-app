/**
 * InMemoryAuthAdapter - In-memory implementation of AuthPort for testing
 *
 * This adapter provides an in-memory implementation of the AuthPort interface
 * suitable for unit testing without external services. It stores users and
 * sessions in memory using Map structures, simulating authentication operations.
 *
 * Key Design Decisions:
 * - Pure in-memory implementation - no external dependencies
 * - Uses Maps for storing users and sessions
 * - Deterministic token generation for reproducible tests
 * - Thread-safe for single-process tests (Bun test runner)
 * - Supports validateToken and refreshSession methods
 * - Compatible with awilix-modular dependency injection
 *
 * Token Format:
 * - Format: `test-token-{counter}`
 * - Counter increments for each generated token
 * - Deterministic for predictable test assertions
 *
 * @module gateways
 */

import {
  type AuthPort,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases/ports/AuthPort";
import {
  AuthContext,
  type Result,
  type UserId,
  UserRole,
  UserId as UserIdFactory,
  ok,
  err,
} from "@mirai-app/domain";

// =============================================================================
// In-Memory Data Types
// =============================================================================

/**
 * In-memory user entry
 */
interface InMemoryUser {
  id: UserId;
  email?: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * In-memory session entry
 */
interface InMemorySession {
  id: string;
  userId: UserId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

// =============================================================================
// InMemoryAuthAdapter
// =============================================================================

/**
 * InMemoryAuthAdapter
 *
 * In-memory implementation of AuthPort for testing purposes.
 * Simulates authentication without external dependencies.
 *
 * Compatible with awilix-modular dependency injection.
 *
 * @example
 * ```typescript
 * // In test setup
 * const container = createTestContainer();
 * container.register({
 *   authPort: asClass(InMemoryAuthAdapter).singleton(),
 * });
 *
 * // Use in tests
 * const authPort = container.resolve<InMemoryAuthAdapter>("authPort");
 *
 * // Create a test user
 * const userId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
 * authPort.createUser({ id: userId, role: UserRole.USER });
 *
 * // Create a session
 * const session = authPort.createSession(userId);
 *
 * // Validate the token
 * const result = await authPort.validateToken(session.token);
 *
 * // Verify
 * expect(result.kind).toBe("ok");
 * ```
 */
export class InMemoryAuthAdapter implements AuthPort {
  private users: Map<string, InMemoryUser> = new Map();
  private sessions: Map<string, InMemorySession> = new Map();
  private tokens: Map<string, string> = new Map(); // token -> sessionId
  private tokenCounter = 0;

  /**
   * Validate an authentication token and return the auth context
   *
   * Looks up the token in the in-memory store and returns the associated
   * AuthContext if valid and not expired.
   *
   * @param token - The authentication token to validate
   * @returns Result<AuthContext, AuthError | InvalidTokenError>
   *
   * @example
   * ```typescript
   * const result = await adapter.validateToken("test-token-1");
   *
   * if (isOk(result)) {
   *   // Token is valid, use auth context
   *   const { userId, role } = result.value;
   *   console.log(`User ${userId} authenticated with role ${role}`);
   * } else {
   *   // Handle error based on error type
   *   if (result.error instanceof InvalidTokenError) {
   *     console.error("Invalid token:", result.error.message);
   *   } else {
   *     console.error("Auth error:", result.error.message);
   *   }
   * }
   * ```
   */
  async validateToken(
    token: string,
  ): Promise<
    Result<AuthContext, AuthError | InvalidTokenError | SessionExpiredError>
  > {
    // Handle empty token case
    if (!token || token.trim().length === 0) {
      return err(
        new InvalidTokenError({
          message: "Token cannot be empty",
          token: token,
        }),
      );
    }

    try {
      // Look up the session by token
      const sessionId = this.tokens.get(token);
      if (!sessionId) {
        return err(
          new InvalidTokenError({
            message: "Invalid or unknown token",
            token,
          }),
        );
      }

      // Get the session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return err(
          new InvalidTokenError({
            message: "Session not found",
            token,
          }),
        );
      }

      // Check if session has expired
      if (session.expiresAt.getTime() < Date.now()) {
        return err(
          new SessionExpiredError({
            sessionId: session.id,
            expiredAt: session.expiresAt,
            message: "Session has expired",
          }),
        );
      }

      // Get the user
      const user = this.users.get(UserIdFactory.toString(session.userId));
      if (!user) {
        return err(
          new InvalidTokenError({
            message: "User not found",
            token,
          }),
        );
      }

      // Create AuthContext
      return this.createAuthContextFromUser(
        user,
        session.id,
        session.createdAt,
      );
    } catch (error) {
      return err(
        new AuthError({
          message: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }
  }

  /**
   * Refresh an existing session and return updated auth context
   *
   * Looks up the session by ID, validates it exists and is not expired,
   * then creates a new session with extended expiration.
   *
   * @param sessionId - The session identifier to refresh
   * @returns Result<AuthContext, AuthError | SessionExpiredError>
   *
   * @example
   * ```typescript
   * const result = await adapter.refreshSession("session-123");
   *
   * if (isOk(result)) {
   *   // Session refreshed successfully
   *   console.log("Session refreshed for user:", result.value.userId);
   * } else {
   *   // Handle session expiration
   *   console.error("Failed to refresh session:", result.error.message);
   * }
   * ```
   */
  async refreshSession(
    sessionId: string,
  ): Promise<Result<AuthContext, AuthError | SessionExpiredError>> {
    try {
      // Get the session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return err(
          new SessionExpiredError({
            sessionId,
            expiredAt: new Date(),
            message: "No active session found",
          }),
        );
      }

      // Check if session has expired
      if (session.expiresAt.getTime() < Date.now()) {
        return err(
          new SessionExpiredError({
            sessionId,
            expiredAt: session.expiresAt,
            message: "Session has expired",
          }),
        );
      }

      // Get the user
      const user = this.users.get(UserIdFactory.toString(session.userId));
      if (!user) {
        return err(
          new SessionExpiredError({
            sessionId,
            expiredAt: new Date(),
            message: "User not found",
          }),
        );
      }

      // Create AuthContext
      return this.createAuthContextFromUser(
        user,
        session.id,
        session.createdAt,
      );
    } catch (error) {
      return err(
        new SessionExpiredError({
          sessionId,
          expiredAt: new Date(),
          message: `Session refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }
  }

  /**
   * Create a test user (for test setup)
   *
   * @param props - User properties
   * @returns The created user ID
   *
   * @example
   * ```typescript
   * const userId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
   * adapter.createUser({
   *   id: userId,
   *   email: "test@example.com",
   *   role: UserRole.USER,
   * });
   * ```
   */
  createUser(props: {
    id: UserId;
    email?: string;
    role?: UserRole;
    createdAt?: Date;
  }): UserId {
    const user: InMemoryUser = {
      id: props.id,
      email: props.email,
      role: props.role ?? UserRole.USER,
      createdAt: props.createdAt ?? new Date(),
    };

    this.users.set(UserIdFactory.toString(user.id), user);
    return user.id;
  }

  /**
   * Create a session for a user (for test setup)
   *
   * @param userId - The user ID to create session for
   * @param expiresInSeconds - Session expiration time (default: 3600 = 1 hour)
   * @returns The created session with token
   *
   * @example
   * ```typescript
   * const userId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
   * const session = adapter.createSession(userId, 3600);
   * console.log("Token:", session.token);
   * ```
   */
  createSession(
    userId: UserId,
    expiresInSeconds: number = 3600,
  ): { sessionId: string; token: string; expiresAt: Date } {
    // Generate deterministic token
    this.tokenCounter++;
    const token = `test-token-${this.tokenCounter}`;
    const sessionId = `test-session-${this.tokenCounter}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

    const session: InMemorySession = {
      id: sessionId,
      userId,
      token,
      createdAt: now,
      expiresAt,
    };

    this.sessions.set(sessionId, session);
    this.tokens.set(token, sessionId);

    return { sessionId, token, expiresAt };
  }

  /**
   * Create a session with a specific ID (for testing specific scenarios)
   *
   * @param sessionId - The specific session ID to use
   * @param userId - The user ID to create session for
   * @param expiresInSeconds - Session expiration time (default: 3600)
   * @returns The created session with token
   */
  createSessionWithId(
    sessionId: string,
    userId: UserId,
    expiresInSeconds: number = 3600,
  ): { token: string; expiresAt: Date } {
    // Generate deterministic token
    this.tokenCounter++;
    const token = `test-token-${this.tokenCounter}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

    const session: InMemorySession = {
      id: sessionId,
      userId,
      token,
      createdAt: now,
      expiresAt,
    };

    this.sessions.set(sessionId, session);
    this.tokens.set(token, sessionId);

    return { token, expiresAt };
  }

  /**
   * Get user by ID (for testing verification)
   */
  getUser(userId: UserId): InMemoryUser | undefined {
    return this.users.get(UserIdFactory.toString(userId));
  }

  /**
   * Get session by ID (for testing verification)
   */
  getSession(sessionId: string): InMemorySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session by token (for testing verification)
   */
  getSessionByToken(token: string): InMemorySession | undefined {
    const sessionId = this.tokens.get(token);
    if (!sessionId) return undefined;
    return this.sessions.get(sessionId);
  }

  /**
   * Check if a user exists (for testing verification)
   */
  hasUser(userId: UserId): boolean {
    return this.users.has(UserIdFactory.toString(userId));
  }

  /**
   * Check if a session exists (for testing verification)
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Delete a user and all their sessions (for test cleanup)
   */
  deleteUser(userId: UserId): void {
    const userIdStr = UserIdFactory.toString(userId);
    const user = this.users.get(userIdStr);
    if (!user) return;

    // Delete all sessions for this user
    for (const [sessionId, session] of this.sessions) {
      if (UserIdFactory.toString(session.userId) === userIdStr) {
        this.tokens.delete(session.token);
        this.sessions.delete(sessionId);
      }
    }

    this.users.delete(userIdStr);
  }

  /**
   * Delete a session (for test cleanup)
   */
  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.tokens.delete(session.token);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Clear all users and sessions (for test cleanup)
   */
  clear(): void {
    this.users.clear();
    this.sessions.clear();
    this.tokens.clear();
    this.tokenCounter = 0;
  }

  /**
   * Get all users (for testing verification)
   */
  getAllUsers(): InMemoryUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Get all sessions (for testing verification)
   */
  getAllSessions(): InMemorySession[] {
    return Array.from(this.sessions.values());
  }

  // =============================================================================
  // Private Helpers
  // =============================================================================

  /**
   * Create AuthContext from user data
   */
  private createAuthContextFromUser(
    user: InMemoryUser,
    sessionId: string,
    authenticatedAt: Date,
  ): Result<AuthContext, AuthError> {
    const authContextResult = AuthContext.create({
      userId: user.id,
      role: user.role,
      authenticatedAt,
      sessionId,
    });

    if (authContextResult.kind === "err") {
      return err(
        new AuthError({
          message: `Failed to create AuthContext: ${authContextResult.error.message}`,
        }),
      );
    }

    return ok(authContextResult.value);
  }
}
