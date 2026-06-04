import type { SupabaseUser } from "@mirai-app/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUserByEmail, ensureGhostAuthUser, loadAuthUsers } from "../auth";
import type { AuthUserByEmail } from "../types";

const mockListUsers = vi.fn();
const mockCreateUser = vi.fn();

vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      admin: {
        listUsers: (...args: unknown[]) =>
          mockListUsers(...args) as Promise<{
            data: { users: SupabaseUser[] } | null;
            error: { message: string } | null;
          }>,
        createUser: (...args: unknown[]) =>
          mockCreateUser(...args) as Promise<{
            data: { user: SupabaseUser | null } | null;
            error: { message: string } | null;
          }>,
      },
    },
  },
}));

vi.mock("../config/env", () => ({
  env: {
    seedGhostEmail: "ghost@test.com",
    seedGhostPassword: "ghost-password",
  },
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadAuthUsers", () => {
    it("should return empty map when no users exist", async () => {
      mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });

      const result = await loadAuthUsers();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("should load users into map by email", async () => {
      const users = [
        { id: "user-1", email: "user1@test.com" },
        { id: "user-2", email: "user2@test.com" },
      ];
      mockListUsers.mockResolvedValue({ data: { users }, error: null });

      const result = await loadAuthUsers();

      expect(result.get("user1@test.com")).toEqual(users[0]);
      expect(result.get("user2@test.com")).toEqual(users[1]);
    });

    it("should normalize email to lowercase", async () => {
      const users = [{ id: "user-1", email: "User@Test.COM" }];
      mockListUsers.mockResolvedValue({ data: { users }, error: null });

      const result = await loadAuthUsers();

      expect(result.get("user@test.com")).toEqual(users[0]);
    });

    it("should skip users without email", async () => {
      const users = [
        { id: "user-1", email: "user1@test.com" },
        { id: "user-2", email: null },
        { id: "user-3", email: "user3@test.com" },
      ];
      mockListUsers.mockResolvedValue({ data: { users }, error: null });

      const result = await loadAuthUsers();

      expect(result.size).toBe(2);
      expect(result.has("user1@test.com")).toBe(true);
      expect(result.has("user3@test.com")).toBe(true);
    });

    it("should handle pagination", async () => {
      const page1Users = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
      }));
      const page2Users = [{ id: "user-1000", email: "user1000@test.com" }];

      mockListUsers
        .mockResolvedValueOnce({ data: { users: page1Users }, error: null })
        .mockResolvedValueOnce({ data: { users: page2Users }, error: null });

      const result = await loadAuthUsers();

      expect(result.size).toBe(1001);
      expect(mockListUsers).toHaveBeenCalledTimes(2);
      expect(mockListUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
      expect(mockListUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
    });

    it("should stop on error", async () => {
      mockListUsers.mockResolvedValue({ data: null, error: { message: "API Error" } });

      const result = await loadAuthUsers();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("should handle empty data response", async () => {
      mockListUsers.mockResolvedValue({ data: null, error: null });

      const result = await loadAuthUsers();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe("createAuthUserByEmail", () => {
    it("should create user successfully", async () => {
      const mockUser = { id: "new-user", email: "new@test.com" };
      mockCreateUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await createAuthUserByEmail("new@test.com", "John", "Doe", "user");

      expect(result).toEqual(mockUser);
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "new@test.com",
        email_confirm: true,
        user_metadata: { firstName: "John", lastName: "Doe" },
        app_metadata: { role: "user" },
      });
    });

    it("should return null on error", async () => {
      mockCreateUser.mockResolvedValue({
        data: null,
        error: { message: "Email already exists" },
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });

      const result = await createAuthUserByEmail("existing@test.com", "John", "Doe", "user");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create Supabase Auth user"),
      );

      consoleSpy.mockRestore();
    });

    it("should return null when no user in response", async () => {
      mockCreateUser.mockResolvedValue({ data: { user: null }, error: null });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });

      const result = await createAuthUserByEmail("test@test.com", "John", "Doe", "user");

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it("should handle different roles", async () => {
      const mockUser = { id: "admin-user", email: "admin@test.com" };
      mockCreateUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      await createAuthUserByEmail("admin@test.com", "Admin", "User", "admin");

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          app_metadata: { role: "admin" },
        }),
      );
    });

    it("should handle empty names", async () => {
      const mockUser = { id: "user", email: "test@test.com" };
      mockCreateUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      await createAuthUserByEmail("test@test.com", "", "", "user");

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_metadata: { firstName: "", lastName: "" },
        }),
      );
    });
  });

  describe("ensureGhostAuthUser", () => {
    it("should return existing ghost user from map", async () => {
      const existingGhost: SupabaseUser = {
        id: "ghost-1",
        email: "ghost@test.com",
      } as SupabaseUser;
      const authUsers: AuthUserByEmail = new Map([["ghost@test.com", existingGhost]]);

      const result = await ensureGhostAuthUser(authUsers);

      expect(result).toEqual(existingGhost);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("should create ghost user if not exists", async () => {
      const newGhost: SupabaseUser = { id: "ghost-new", email: "ghost@test.com" } as SupabaseUser;
      mockCreateUser.mockResolvedValue({ data: { user: newGhost }, error: null });

      const authUsers: AuthUserByEmail = new Map();
      const result = await ensureGhostAuthUser(authUsers);

      expect(result).toEqual(newGhost);
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "ghost@test.com",
        password: "ghost-password",
        email_confirm: true,
        user_metadata: { firstName: "Ghost", lastName: "User" },
        app_metadata: { role: "user" },
      });
      expect(authUsers.get("ghost@test.com")).toEqual(newGhost);
    });

    it("should handle ghost user creation error", async () => {
      mockCreateUser.mockResolvedValue({
        data: null,
        error: { message: "Creation failed" },
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });
      const authUsers: AuthUserByEmail = new Map();

      const result = await ensureGhostAuthUser(authUsers);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create ghost auth user"),
      );

      consoleSpy.mockRestore();
    });

    it("should normalize ghost email to lowercase in map", async () => {
      vi.doMock("../config/env", () => ({
        env: {
          seedGhostEmail: "GHOST@TEST.COM",
          seedGhostPassword: "ghost-password",
        },
      }));

      const newGhost: SupabaseUser = { id: "ghost-1", email: "GHOST@TEST.COM" } as SupabaseUser;
      mockCreateUser.mockResolvedValue({ data: { user: newGhost }, error: null });

      const { ensureGhostAuthUser: ensureGhostWithUppercase } = await import("../auth");
      const authUsers: AuthUserByEmail = new Map();

      await ensureGhostWithUppercase(authUsers);

      expect(authUsers.get("ghost@test.com")).toEqual(newGhost);
    });
  });
});
