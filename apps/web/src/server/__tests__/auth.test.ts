import {
  getSession,
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../auth";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import {
  getSession as getAuthSession,
  requireAuth as requireAuthBase,
  requireAdmin as requireAdminBase,
  requireModerator as requireModeratorBase,
} from "@integral-2025-app/auth";

jest.mock("~/lib/supabase/server");
jest.mock("@integral-2025-app/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock("@integral-2025-app/auth", () => ({
  getSession: jest.fn(),
  requireAuth: jest.fn(),
  requireAdmin: jest.fn(),
  requireModerator: jest.fn(),
}));

const mockCreateServerSupabaseClient =
  createServerSupabaseClient as jest.MockedFunction<
    typeof createServerSupabaseClient
  >;
const mockGetAuthSession = getAuthSession as jest.MockedFunction<
  typeof getAuthSession
>;
const mockRequireAuthBase = requireAuthBase as jest.MockedFunction<
  typeof requireAuthBase
>;
const mockRequireAdminBase = requireAdminBase as jest.MockedFunction<
  typeof requireAdminBase
>;
const mockRequireModeratorBase = requireModeratorBase as jest.MockedFunction<
  typeof requireModeratorBase
>;

describe("server/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSession", () => {
    it("should return null when no Supabase user", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getSession();

      expect(result).toBeNull();
      expect(mockGetAuthSession).toHaveBeenCalled();
    });

    it("should return session with null user when user not in database", async () => {
      const mockSupabase = {} as any;

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetAuthSession.mockResolvedValue({
        user: null,
        authUserId: "supabase-123",
      });

      const result = await getSession();

      expect(result).toEqual({
        user: null,
        authUserId: "supabase-123",
      });
    });

    it("should return session with user when user exists in database", async () => {
      const mockSupabase = {} as any;
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetAuthSession.mockResolvedValue({
        user: mockAuthUser,
        authUserId: "supabase-123",
      });

      const result = await getSession();

      expect(result).toEqual({
        user: mockAuthUser,
        authUserId: "supabase-123",
      });
    });
  });

  describe("requireAuth", () => {
    it("should throw error when session is null", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireAuthBase.mockRejectedValue(new Error("Unauthorized"));

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("should throw error when session user is null", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireAuthBase.mockRejectedValue(new Error("Unauthorized"));

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("should throw error when user not found in database on second lookup", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireAuthBase.mockRejectedValue(
        new Error("User not found in database"),
      );

      await expect(requireAuth()).rejects.toThrow("User not found in database");
    });

    it("should return user and dbUser when authenticated", async () => {
      const mockSupabase = {} as any;
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
        isAdmin: false,
        isModerator: false,
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireAuthBase.mockResolvedValue({
        user: mockAuthUser as any,
        dbUser: mockDbUser as any,
      });

      const result = await requireAuth();

      expect(result).toEqual({
        user: mockAuthUser,
        dbUser: mockDbUser,
      });
    });
  });

  describe("requireAdmin", () => {
    it("should throw error when user is not admin", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireAdminBase.mockRejectedValue(
        new Error("Admin access required"),
      );

      await expect(requireAdmin()).rejects.toThrow("Admin access required");
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabase = {} as any;
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "admin@example.com",
        name: "Admin User",
        emailVerified: new Date(),
        isAdmin: true,
        isModerator: false,
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireAdminBase.mockResolvedValue(mockDbUser as any);

      const result = await requireAdmin();

      expect(result).toEqual(mockDbUser);
    });
  });

  describe("requireModerator", () => {
    it("should throw error when user is neither moderator nor admin", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireModeratorBase.mockRejectedValue(
        new Error("Moderator access required"),
      );

      await expect(requireModerator()).rejects.toThrow(
        "Moderator access required",
      );
    });

    it("should return dbUser when user is moderator", async () => {
      const mockSupabase = {} as any;
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "mod@example.com",
        name: "Moderator User",
        emailVerified: new Date(),
        isAdmin: false,
        isModerator: true,
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireModeratorBase.mockResolvedValue(mockDbUser as any);

      const result = await requireModerator();

      expect(result).toEqual(mockDbUser);
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabase = {} as any;
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "admin@example.com",
        name: "Admin User",
        emailVerified: new Date(),
        isAdmin: true,
        isModerator: false,
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockRequireModeratorBase.mockResolvedValue(mockDbUser as any);

      const result = await requireModerator();

      expect(result).toEqual(mockDbUser);
    });
  });
});
