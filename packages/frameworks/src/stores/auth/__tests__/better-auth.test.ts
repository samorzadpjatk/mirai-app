/**
 * Better Auth Store Tests
 *
 * Unit tests for the mobile auth store with SecureStore integration.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  betterAuthStore,
  shouldRefreshSession,
  getSessionExpiryStatus,
  isSecureStorageAvailable,
  __resetInternalState,
  type BetterAuthClient,
  type BetterAuthSession,
  AuthErrorCodes,
  createAuthError,
  type AuthStoreError,
  safeParseUrl,
} from "../better-auth";

// =============================================================================
// Test Data
// =============================================================================

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  emailVerified: true,
  name: "Test User",
};

const mockSession: BetterAuthSession = {
  id: "session-456",
  userId: "user-123",
  token: "test-token-xyz",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
};

const createMockClient = (): BetterAuthClient => ({
  config: {
    baseURL: "http://localhost:3000",
    basePath: "/api/auth",
  },
  signIn: {
    email: mock(async () => ({
      data: { user: mockUser, session: mockSession },
      error: null,
    })),
  },
  signUp: {
    email: mock(async () => ({
      data: { user: mockUser },
      error: null,
    })),
  },
  signOut: mock(async () => ({ error: null })),
  getSession: mock(async () => ({
    data: { user: mockUser, session: mockSession },
    error: null,
  })),
  emailOtp: {
    sendVerificationOtp: mock(async () => ({
      data: { success: true },
      error: null,
    })),
    verifyEmail: mock(async () => ({
      data: { user: mockUser, session: mockSession },
      error: null,
    })),
  },
});

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] BetterAuthStore", () => {
  beforeEach(() => {
    // Reset store state
    betterAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      lastError: null,
    });

    // Reset internal module-level state
    __resetInternalState();
  });

  describe("Store State", () => {
    it("should have initial state with null user and session", () => {
      const state = betterAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.lastError).toBeNull();
    });

    it("should set user and update authentication status", () => {
      betterAuthStore.getState().setUser(mockUser);

      const state = betterAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should set loading state", () => {
      betterAuthStore.getState().setLoading(true);

      const state = betterAuthStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it("should clear user and update authentication status", () => {
      betterAuthStore.getState().setUser(mockUser);
      betterAuthStore.getState().setUser(null);

      const state = betterAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("SecureStore Integration", () => {
    it("should save and load session using setSession and getSession", async () => {
      // First set the session
      const result = await betterAuthStore.getState().setSession({
        user: mockUser,
        session: mockSession,
      });

      // Verify result is success
      expect(result.success).toBe(true);

      // Verify store state updated
      const state = betterAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session?.token).toBe(mockSession.token);
      expect(state.isAuthenticated).toBe(true);

      // Reset store state to simulate app restart
      betterAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        lastError: null,
      });

      // Load session from storage
      const loaded = await betterAuthStore.getState().getSession();

      expect(loaded.user).toEqual(mockUser);
      expect(loaded.session?.token).toBe(mockSession.token);
    });

    it("should clear session when clearSession is called", async () => {
      // First set a session
      await betterAuthStore.getState().setSession({
        user: mockUser,
        session: mockSession,
      });

      // Verify session exists
      let result = await betterAuthStore.getState().getSession();
      expect(result.user).not.toBeNull();

      // Clear session
      await betterAuthStore.getState().clearSession();

      // Verify session is cleared from store
      const state = betterAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      // Verify session is cleared from storage
      result = await betterAuthStore.getState().getSession();
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it("should return null when no session exists", async () => {
      const result = await betterAuthStore.getState().getSession();

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it("should return null for expired session", async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      // Set expired session
      await betterAuthStore.getState().setSession({
        user: mockUser,
        session: expiredSession,
      });

      // Get session should return null for expired
      const result = await betterAuthStore.getState().getSession();
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });
  });

  describe("Cookie Jar Pattern", () => {
    it("should extract cookies from headers", async () => {
      const headers = new Headers({
        "set-cookie": "session=abc123; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Strict",
      });

      await betterAuthStore.getState().extractCookies(headers);

      // Get cookies for request to verify they were stored
      const cookies = await betterAuthStore.getState().getCookiesForRequest("https://example.com/api");
      expect(cookies).toContain("session=abc123");
    });

    it("should get formatted cookies for request URL", async () => {
      // First set some cookies via extract (simulating separate headers)
      const headers1 = new Headers({
        "set-cookie": "session=abc123; Domain=example.com; Path=/",
      });

      const headers2 = new Headers({
        "set-cookie": "auth=token456; Domain=example.com; Path=/",
      });

      await betterAuthStore.getState().extractCookies(headers1);
      await betterAuthStore.getState().extractCookies(headers2);

      // Get cookies for matching URL
      const cookies = await betterAuthStore.getState().getCookiesForRequest("https://example.com/api");

      expect(cookies).toContain("session=abc123");
      expect(cookies).toContain("auth=token456");
    });

    it("should return empty string for URL with no matching cookies", async () => {
      const cookies = await betterAuthStore.getState().getCookiesForRequest("https://other.com/api");

      expect(cookies).toBe("");
    });

    it("should not include expired cookies", async () => {
      const headers = new Headers({
        "set-cookie": "expired=old; Domain=example.com; Path=/; Expires=Wed, 21 Oct 2020 07:28:00 GMT",
      });

      await betterAuthStore.getState().extractCookies(headers);

      const cookies = await betterAuthStore.getState().getCookiesForRequest("https://example.com/api");
      expect(cookies).not.toContain("expired=old");
    });
  });

  describe("Authentication Flows", () => {
    it("should sign in with password and save session", async () => {
      const client = createMockClient();
      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().signInWithPassword("test@example.com", "password123");

      // Verify result is success
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
        expect(result.data.session.token).toBe(mockSession.token);
      }

      // Verify store state
      const state = betterAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session?.token).toBe(mockSession.token);
      expect(state.isAuthenticated).toBe(true);

      // Verify session was persisted
      const stored = await betterAuthStore.getState().getSession();
      expect(stored.user).toEqual(mockUser);
    });

    it("should sign in with OTP and save session", async () => {
      const client = createMockClient();
      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().signInWithOtp("test@example.com", "123456");

      // Verify result is success
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
        expect(result.data.session.token).toBe(mockSession.token);
      }

      const state = betterAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session?.token).toBe(mockSession.token);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should send sign-in OTP", async () => {
      const client = createMockClient();
      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().sendSignInOtp("test@example.com");

      expect(result.success).toBe(true);
      expect(client.emailOtp.sendVerificationOtp).toHaveBeenCalledWith("test@example.com", "sign-in");
    });

    it("should sign up and return success", async () => {
      const client = createMockClient();
      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().signUp("test@example.com", "password123", "Test User");

      // Verify result is success
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toBeDefined();
      }

      expect(client.signUp.email).toHaveBeenCalled();
    });

    it("should sign out and clear session", async () => {
      const client = createMockClient();
      betterAuthStore.getState().initialize({ client });

      // First sign in
      await betterAuthStore.getState().signInWithPassword("test@example.com", "password123");

      // Verify signed in
      let state = betterAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);

      // Then sign out
      const result = await betterAuthStore.getState().signOut();

      // Verify result is success
      expect(result.success).toBe(true);

      state = betterAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      // Verify session cleared from storage
      const stored = await betterAuthStore.getState().getSession();
      expect(stored.user).toBeNull();
    });

    it("should return error when not initialized", async () => {
      // Reset store to ensure no client is set
      betterAuthStore.setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        lastError: null,
      });

      const result = await betterAuthStore.getState().signInWithPassword("test@example.com", "password123");

      // Verify result is error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AuthErrorCodes.NOT_INITIALIZED);
        expect(result.error.message).toContain("not initialized");
      }

      // Verify error is in store state
      const state = betterAuthStore.getState();
      expect(state.lastError).not.toBeNull();
      expect(state.lastError?.code).toBe(AuthErrorCodes.NOT_INITIALIZED);
    });

    it("should handle sign in error with structured error", async () => {
      const client = createMockClient();
      client.signIn.email = mock(async () => ({
        data: null,
        error: { message: "Invalid credentials" },
      }));

      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().signInWithPassword("test@example.com", "wrong");

      // Verify result is error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AuthErrorCodes.INVALID_CREDENTIALS);
        expect(result.error.message).toBe("Invalid credentials");
      }

      const state = betterAuthStore.getState();
      expect(state.lastError?.code).toBe(AuthErrorCodes.INVALID_CREDENTIALS);
      expect(state.lastError?.message).toBe("Invalid credentials");
    });
  });

  describe("Session Refresh", () => {
    it("should refresh session when nearing expiry", async () => {
      const nearExpirySession: BetterAuthSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // Expires in 2 minutes
      };

      const client = createMockClient();
      client.getSession = mock(async () => ({
        data: { user: mockUser, session: mockSession },
        error: null,
      }));

      // Set initial state with near-expiry session
      betterAuthStore.setState({
        user: mockUser,
        session: nearExpirySession,
        isAuthenticated: true,
        isLoading: false,
        lastError: null,
      });

      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().refreshSession();

      expect(result.success).toBe(true);
      expect(client.getSession).toHaveBeenCalled();

      // Verify updated session in store
      const state = betterAuthStore.getState();
      expect(state.session?.token).toBe(mockSession.token);
    });

    it("should not refresh when session is fresh", async () => {
      const freshSession: BetterAuthSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1 hour
      };

      const client = createMockClient();

      // Set initial state with fresh session
      betterAuthStore.setState({
        user: mockUser,
        session: freshSession,
        isAuthenticated: true,
        isLoading: false,
        lastError: null,
      });

      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().refreshSession();

      // Should return success without calling getSession
      expect(result.success).toBe(true);
      expect(client.getSession).not.toHaveBeenCalled();
    });

    it("should clear session when refresh fails", async () => {
      const nearExpirySession: BetterAuthSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      };

      const client = createMockClient();
      client.getSession = mock(async () => ({
        data: null,
        error: { message: "Session expired" },
      }));

      betterAuthStore.setState({
        user: mockUser,
        session: nearExpirySession,
        isAuthenticated: true,
        isLoading: false,
        lastError: null,
      });

      betterAuthStore.getState().initialize({ client });

      const result = await betterAuthStore.getState().refreshSession();

      // Verify result is error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AuthErrorCodes.SESSION_EXPIRED);
      }

      const state = betterAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("Utility Functions", () => {
    describe("shouldRefreshSession", () => {
      it("should return true when session expires within threshold", () => {
        const nearExpirySession: BetterAuthSession = {
          ...mockSession,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
        };

        expect(shouldRefreshSession(nearExpirySession)).toBe(true);
      });

      it("should return false when session is fresh", () => {
        const freshSession: BetterAuthSession = {
          ...mockSession,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        };

        expect(shouldRefreshSession(freshSession)).toBe(false);
      });
    });

    describe("getSessionExpiryStatus", () => {
      it("should return correct expiry status for valid session", () => {
        const session: BetterAuthSession = {
          ...mockSession,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        };

        const status = getSessionExpiryStatus(session);
        expect(status.isExpired).toBe(false);
        expect(status.expiresInMs).toBeGreaterThan(0);
        expect(status.expiresInMs).toBeLessThanOrEqual(30 * 60 * 1000);
      });

      it("should return expired status for past session", () => {
        const session: BetterAuthSession = {
          ...mockSession,
          expiresAt: new Date(Date.now() - 1000),
        };

        const status = getSessionExpiryStatus(session);
        expect(status.isExpired).toBe(true);
        expect(status.expiresInMs).toBeLessThan(0);
      });
    });

    describe("isSecureStorageAvailable", () => {
      it("should return false in test environment (fallback mode)", () => {
        // In test environment without expo-secure-store, should use fallback
        expect(isSecureStorageAvailable()).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should create structured auth error", () => {
      const error = createAuthError(
        AuthErrorCodes.INVALID_CREDENTIALS,
        "Invalid email or password",
        { email: "test@example.com" },
      );

      expect(error.code).toBe(AuthErrorCodes.INVALID_CREDENTIALS);
      expect(error.message).toBe("Invalid email or password");
      expect(error.details).toEqual({ email: "test@example.com" });
    });

    it("should store structured error in state", async () => {
      const client = createMockClient();
      client.signIn.email = mock(async () => ({
        data: null,
        error: { message: "Network error" },
      }));

      betterAuthStore.getState().initialize({ client });

      await betterAuthStore.getState().signInWithPassword("test@example.com", "password");

      const state = betterAuthStore.getState();
      expect(state.lastError).not.toBeNull();
      expect(typeof state.lastError?.code).toBe("string");
      expect(typeof state.lastError?.message).toBe("string");
    });
  });

  describe("URL Parsing (safeParseUrl)", () => {
    it("should parse valid URLs", () => {
      const result = safeParseUrl("https://example.com/api/auth");
      expect(result).not.toBeNull();
      expect(result?.hostname).toBe("example.com");
      expect(result?.pathname).toBe("/api/auth");
    });

    it("should handle URLs without protocol by adding https://", () => {
      const result = safeParseUrl("example.com/api");
      expect(result).not.toBeNull();
      expect(result?.hostname).toBe("example.com");
    });

    it("should return null for completely invalid URLs", () => {
      const result = safeParseUrl("not a url at all!!!");
      expect(result).toBeNull();
    });

    it("should handle URLs with ports", () => {
      const result = safeParseUrl("http://localhost:3000/api/auth");
      expect(result).not.toBeNull();
      expect(result?.hostname).toBe("localhost");
      expect(result?.port).toBe("3000");
    });
  });

  describe("Store Initialization", () => {
    it("should load stored session on init if available", async () => {
      // Pre-populate storage
      await betterAuthStore.getState().setSession({
        user: mockUser,
        session: mockSession,
      });

      // Reset only the store state (not storage)
      betterAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
        lastError: null,
      });

      // Verify store is empty
      const state = betterAuthStore.getState();
      expect(state.user).toBeNull();

      // Now re-initialize by loading from storage
      const loaded = await betterAuthStore.getState().getSession();

      // Verify loaded from storage
      expect(loaded.user).toEqual(mockUser);
      expect(loaded.session?.token).toBe(mockSession.token);
    });
  });
});
