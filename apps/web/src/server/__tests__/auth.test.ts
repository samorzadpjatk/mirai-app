import {
  getSession,
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../auth";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import { db } from "~/server/db";
import {
  getServerUser,
  mapDatabaseUserToAuthUser,
} from "@integral-2025-app/auth";

jest.mock("~/lib/supabase/server");
jest.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock("@integral-2025-app/auth", () => ({
  getServerUser: jest.fn(),
  mapDatabaseUserToAuthUser: jest.fn(),
}));

const mockCreateServerSupabaseClient =
  createServerSupabaseClient as jest.MockedFunction<
    typeof createServerSupabaseClient
  >;
const mockGetServerUser = getServerUser as jest.MockedFunction<
  typeof getServerUser
>;
const mockMapDatabaseUserToAuthUser =
  mapDatabaseUserToAuthUser as jest.MockedFunction<
    typeof mapDatabaseUserToAuthUser
  >;

describe("server/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSession", () => {
    it("should return null when no Supabase user", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(null);

      const result = await getSession();

      expect(result).toBeNull();
      expect(mockGetServerUser).toHaveBeenCalledWith(mockSupabase);
    });

    it("should return session with null user when user not in database", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = {
        id: "supabase-123",
        email: "test@example.com",
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getSession();

      expect(result).toEqual({
        user: null,
        authUserId: "supabase-123",
      });
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { authUserId: "supabase-123" },
      });
    });

    it("should return session with user when user exists in database", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = {
        id: "supabase-123",
        email: "test@example.com",
      };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      const result = await getSession();

      expect(result).toEqual({
        user: mockAuthUser,
        authUserId: "supabase-123",
      });
      expect(mockMapDatabaseUserToAuthUser).toHaveBeenCalledWith(mockDbUser);
    });
  });

  describe("requireAuth", () => {
    it("should throw error when session is null", async () => {
      const mockSupabase = {} as any;
      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("should throw error when session user is null", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("should throw error when user not found in database on second lookup", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockDbUser)
        .mockResolvedValueOnce(null);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      await expect(requireAuth()).rejects.toThrow("User not found in database");
    });

    it("should return user and dbUser when authenticated", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
        isAdmin: false,
        isModerator: false,
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

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
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        isAdmin: false,
        isModerator: false,
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      await expect(requireAdmin()).rejects.toThrow("Admin access required");
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        isAdmin: true,
        isModerator: false,
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      const result = await requireAdmin();

      expect(result).toEqual(mockDbUser);
    });
  });

  describe("requireModerator", () => {
    it("should throw error when user is neither moderator nor admin", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        isAdmin: false,
        isModerator: false,
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      await expect(requireModerator()).rejects.toThrow(
        "Moderator access required",
      );
    });

    it("should return dbUser when user is moderator", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        isAdmin: false,
        isModerator: true,
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      const result = await requireModerator();

      expect(result).toEqual(mockDbUser);
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabase = {} as any;
      const mockSupabaseUser = { id: "supabase-123" };
      const mockDbUser = {
        id: "db-123",
        authUserId: "supabase-123",
        isAdmin: true,
        isModerator: false,
      };
      const mockAuthUser = {
        id: "db-123",
        authUserId: "supabase-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
      mockGetServerUser.mockResolvedValue(mockSupabaseUser as any);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockMapDatabaseUserToAuthUser.mockReturnValue(mockAuthUser as any);

      const result = await requireModerator();

      expect(result).toEqual(mockDbUser);
    });
  });
});
