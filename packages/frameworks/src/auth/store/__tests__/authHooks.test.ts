import { describe, it, expect, beforeEach } from "bun:test";
import {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
} from "../authHooks";
import { authStore } from "../../../stores/authStore";

// Reset store before each test
const resetStore = () => {
  authStore.setState({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
};

describe("[UNIT] authHooks", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("useAuth", () => {
    it("should return auth state and actions", () => {
      const auth = useAuth();

      expect(auth.user).toBeNull();
      expect(auth.session).toBeNull();
      expect(auth.isLoading).toBe(true);
      expect(auth.isAuthenticated).toBe(false);
      expect(typeof auth.signInWithOtp).toBe("function");
      expect(typeof auth.signOut).toBe("function");
    });

    it("should reflect authenticated state", () => {
      authStore.setState({
        user: {
          id: "user-123",
          authUserId: "auth-123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          name: "Test User",
          emailVerified: null,
          role: "USER",
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const auth = useAuth();
      expect(auth.isAuthenticated).toBe(true);
      expect(auth.user?.email).toBe("test@example.com");
    });
  });

  describe("useUser", () => {
    it("should return null when no user", () => {
      const user = useUser();
      expect(user).toBeNull();
    });

    it("should return user when authenticated", () => {
      authStore.setState({
        user: {
          id: "user-123",
          authUserId: "auth-123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          name: "Test User",
          emailVerified: null,
          role: "USER",
        },
      });

      const user = useUser();
      expect(user).not.toBeNull();
      expect(user?.id).toBe("user-123");
    });
  });

  describe("useSession", () => {
    it("should return null when no session", () => {
      const session = useSession();
      expect(session).toBeNull();
    });

    it("should return session when set", () => {
      const mockSession = {
        user: { id: "user-123", email: "test@example.com" },
        access_token: "token-123",
        refresh_token: "refresh-123",
      };
      authStore.setState({ session: mockSession });

      const session = useSession();
      expect(session).not.toBeNull();
      expect(session?.access_token).toBe("token-123");
    });
  });

  describe("useIsAuthenticated", () => {
    it("should return false when not authenticated", () => {
      const isAuthenticated = useIsAuthenticated();
      expect(isAuthenticated).toBe(false);
    });

    it("should return true when authenticated", () => {
      authStore.setState({ isAuthenticated: true });
      const isAuthenticated = useIsAuthenticated();
      expect(isAuthenticated).toBe(true);
    });
  });

  describe("useAuthLoading", () => {
    it("should return true when loading", () => {
      const isLoading = useAuthLoading();
      expect(isLoading).toBe(true);
    });

    it("should return false when not loading", () => {
      authStore.setState({ isLoading: false });
      const isLoading = useAuthLoading();
      expect(isLoading).toBe(false);
    });
  });
});
