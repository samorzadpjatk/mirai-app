import type { SupabaseUser } from "@mirai-app/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "../trips";
import type { AuthUserByEmail, CsvUser } from "../types";

const mockReadTextFile = vi.fn();
const mockReadFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));
const mockParseUsersCsv = vi.fn();
const mockCreateAuthUserByEmail = vi.fn();
const mockEnsureGhostAuthUser = vi.fn();

const mockTripFindFirst = vi.fn();
const mockTripCreate = vi.fn();
const mockTripUpdate = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserCreate = vi.fn();
const mockUserUpdate = vi.fn();
const mockTripParticipantUpsert = vi.fn();

const mockUpload = vi.fn();

vi.mock("../utils/fs", () => ({
  readTextFile: (path: string) => mockReadTextFile(path) as Promise<string>,
  readFile: (path: string) =>
    mockReadFile(path) as { stream: () => unknown; stat: () => Promise<{ size: number }> },
}));

vi.mock("../utils/path", () => ({
  joinPath: (...args: string[]) => mockJoinPath(...args),
}));

vi.mock("../users", () => ({
  parseUsersCsv: (csv: string) => mockParseUsersCsv(csv) as CsvUser[],
}));

vi.mock("../auth", () => ({
  createAuthUserByEmail: (...args: unknown[]) =>
    mockCreateAuthUserByEmail(...args) as Promise<SupabaseUser | null>,
  ensureGhostAuthUser: (authUsers: AuthUserByEmail) =>
    mockEnsureGhostAuthUser(authUsers) as Promise<SupabaseUser | null>,
}));

vi.mock("@mirai-app/db", () => ({
  trips: { __table: "trips" },
  users: { __table: "users" },
  tripParticipants: {
    __table: "tripParticipants",
    userId: { name: "userId" },
    tripId: { name: "tripId" },
  },
}));

vi.mock("../config/db", () => ({
  db: {
    query: {
      trips: {
        findFirst: (...args: unknown[]) =>
          mockTripFindFirst(...args) as Promise<{ id: string; name: string } | null>,
      },
      users: {
        findFirst: (...args: unknown[]) =>
          mockUserFindFirst(...args) as Promise<{
            id: string;
            authUserId: string;
            role: string;
          } | null>,
      },
    },
    update: (table: { __table?: string }) => ({
      set: (data: unknown) => ({
        where: () => {
          if (table?.__table === "trips") {
            mockTripUpdate(data);
          } else if (table?.__table === "users") {
            mockUserUpdate(data);
          }
          return Promise.resolve({});
        },
      }),
    }),
    insert: (table: { __table?: string }) => ({
      values: (data: Record<string, unknown>) => ({
        returning: () => {
          if (table?.__table === "trips") {
            mockTripCreate(data);
            return Promise.resolve([{ id: "trip-1", ...data }]);
          }
          if (table?.__table === "users") {
            mockUserCreate(data);
            return Promise.resolve([{ id: "db-new", ...data }]);
          }
          return Promise.resolve([]);
        },
        onConflictDoUpdate: (opts: Record<string, unknown>) => {
          if (table?.__table === "tripParticipants") {
            mockTripParticipantUpsert({ values: data, ...opts });
          }
          return Promise.resolve();
        },
        onConflictDoNothing: () => {
          if (table?.__table === "tripParticipants") {
            mockTripParticipantUpsert({ values: data, conflictAction: "nothing" });
          }
          return Promise.resolve();
        },
      }),
    }),
  },
}));

vi.mock("../config/supabase", () => ({
  supabase: {
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: unknown, options: object) =>
          mockUpload(bucket, path, file, options) as Promise<{ error: { message: string } | null }>,
        remove: () => Promise.resolve({ error: null }),
      }),
    },
  },
}));

vi.mock("../config/env", () => ({
  env: {
    imageBucket: "image",
  },
}));

describe("trips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("seedTrip", () => {
    it("should create new trip when it does not exist", async () => {
      const tripConfig = {
        key: "new-trip",
        name: "New Trip",
        description: "A new trip",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "New Trip" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();

      const result = await seedTrip(tripConfig, "users/test.csv", "/test/assets/dev", authUsers);

      expect(mockTripCreate).toHaveBeenCalledWith({
        name: "New Trip",
        description: "A new trip",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-10"),
        backgroundImagePath: undefined,
      });
      expect(result).toEqual({
        id: "trip-1",
        name: "New Trip",
        description: "A new trip",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-10"),
        backgroundImagePath: undefined,
      });
    });

    it("should update existing trip", async () => {
      const tripConfig = {
        key: "existing-trip",
        name: "Existing Trip",
        description: "Updated description",
        startDate: "2026-02-01",
        endDate: "2026-02-10",
        users: "users/test.csv",
      };

      const existingTrip = { id: "trip-1", name: "Existing Trip" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockTripFindFirst.mockResolvedValue(existingTrip);
      mockTripUpdate.mockResolvedValue({ ...existingTrip, description: "Updated description" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();

      await seedTrip(tripConfig, "users/test.csv", "/test/assets/dev", authUsers);

      expect(mockTripUpdate).toHaveBeenCalledWith({
        description: "Updated description",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-02-10"),
        backgroundImagePath: undefined,
      });
    });

    it("should upload background image when specified", async () => {
      const tripConfig = {
        key: "trip-with-bg",
        name: "Trip With Background",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
        background: "images/background.jpg",
      };

      const mockFile = {
        stream: () => ({}),
        stat: vi.fn().mockResolvedValue({ size: 1024 }),
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Background" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/test.csv", "/test/assets/dev", authUsers);

      expect(mockReadFile).toHaveBeenCalledWith("/test/assets/dev/images/background.jpg");
      expect(mockUpload).toHaveBeenCalledWith(
        "image",
        "trips/trip-with-bg/background.jpg",
        mockFile,
        {
          upsert: true,
          contentType: "image/jpeg",
        },
      );

      consoleSpy.mockRestore();
    });

    it("should skip background upload if file is empty", async () => {
      const tripConfig = {
        key: "trip-with-empty-bg",
        name: "Trip With Empty Background",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
        background: "images/empty.jpg",
      };

      const mockFile = {
        stream: () => ({}),
        stat: vi.fn().mockResolvedValue({ size: 0 }),
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockReadFile.mockReturnValue(mockFile);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Empty Background" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();

      await seedTrip(tripConfig, "users/test.csv", "/test/assets/dev", authUsers);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("should handle background upload errors gracefully", async () => {
      const tripConfig = {
        key: "trip-with-bg",
        name: "Trip With Background",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
        background: "images/background.jpg",
      };

      const mockFile = {
        stream: () => ({}),
        stat: vi.fn().mockResolvedValue({ size: 1024 }),
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Background" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/test.csv", "/test/assets/dev", authUsers);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Background upload failed"));

      warnSpy.mockRestore();
    });

    it("should handle background file read errors gracefully", async () => {
      const tripConfig = {
        key: "trip-with-bg",
        name: "Trip With Background",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
        background: "images/missing.jpg",
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockReadFile.mockImplementation(() => {
        throw new Error("File not found");
      });
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Background" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/test.csv", "/test/assets/dev", authUsers);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining("✗ Failed to read background image"),
      );

      warnSpy.mockRestore();
    });

    it("should create users and add as participants", async () => {
      const tripConfig = {
        key: "trip-with-users",
        name: "Trip With Users",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "user1@test.com", firstName: "User", lastName: "One", role: "user" },
        { email: "user2@test.com", firstName: "User", lastName: "Two", role: "admin" },
      ];

      const authUser1 = { id: "auth-1", email: "user1@test.com" };
      const authUser2 = { id: "auth-2", email: "user2@test.com" };
      const dbUser1 = { id: "db-1", authUserId: "auth-1", role: "USER" };
      const dbUser2 = { id: "db-2", authUserId: "auth-2", role: "ADMIN" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Users" });
      mockCreateAuthUserByEmail.mockResolvedValueOnce(authUser1).mockResolvedValueOnce(authUser2);
      mockUserFindFirst.mockResolvedValueOnce(dbUser1).mockResolvedValueOnce(dbUser2);
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockCreateAuthUserByEmail).toHaveBeenCalledTimes(2);
      expect(mockTripParticipantUpsert).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it("should use existing auth users if available", async () => {
      const tripConfig = {
        key: "trip-with-existing",
        name: "Trip With Existing Users",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "existing@test.com", firstName: "Existing", lastName: "User", role: "user" },
      ];

      const existingAuthUser = { id: "auth-existing", email: "existing@test.com" } as SupabaseUser;
      const dbUser = { id: "db-existing", authUserId: "auth-existing", role: "USER" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Existing Users" });
      mockUserFindFirst.mockResolvedValue(dbUser);
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers = new Map([["existing@test.com", existingAuthUser]]);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockCreateAuthUserByEmail).not.toHaveBeenCalled();
      expect(mockTripParticipantUpsert).toHaveBeenCalledWith({
        values: { userId: "db-existing", tripId: "trip-1" },
        conflictAction: "nothing",
      });

      consoleSpy.mockRestore();
    });

    it("should create DB user manually if not exists", async () => {
      const tripConfig = {
        key: "trip-with-new-db-user",
        name: "Trip With New DB User",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "new@test.com", firstName: "New", lastName: "User", role: "moderator" },
      ];

      const authUser = { id: "auth-new", email: "new@test.com" };
      const newDbUser = { id: "db-new", authUserId: "auth-new", role: "MODERATOR" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With New DB User" });
      mockCreateAuthUserByEmail.mockResolvedValue(authUser);
      mockUserFindFirst.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue(newDbUser);
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockUserCreate).toHaveBeenCalledWith({
        authUserId: "auth-new",
        firstName: "New",
        lastName: "User",
        role: "MODERATOR",
      });

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should update user role if it does not match CSV", async () => {
      const tripConfig = {
        key: "trip-with-role-update",
        name: "Trip With Role Update",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "user@test.com", firstName: "User", lastName: "Test", role: "admin" },
      ];

      const authUser = { id: "auth-1", email: "user@test.com" } as SupabaseUser;
      const dbUser = { id: "db-1", authUserId: "auth-1", role: "USER" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Role Update" });
      mockUserFindFirst.mockResolvedValue(dbUser);
      mockUserUpdate.mockResolvedValue({ ...dbUser, role: "ADMIN" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers = new Map([["user@test.com", authUser]]);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockUserUpdate).toHaveBeenCalledWith({
        role: "ADMIN",
      });
    });

    it("should skip users without email", async () => {
      const tripConfig = {
        key: "trip-with-empty-email",
        name: "Trip With Empty Email",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "", firstName: "No", lastName: "Email", role: "user" },
        { email: "valid@test.com", firstName: "Valid", lastName: "Email", role: "user" },
      ];

      const authUser = { id: "auth-1", email: "valid@test.com" };
      const dbUser = { id: "db-1", authUserId: "auth-1", role: "USER" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Empty Email" });
      mockCreateAuthUserByEmail.mockResolvedValue(authUser);
      mockUserFindFirst.mockResolvedValue(dbUser);
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockCreateAuthUserByEmail).toHaveBeenCalledTimes(1);
      expect(mockCreateAuthUserByEmail).toHaveBeenCalledWith(
        "valid@test.com",
        "Valid",
        "Email",
        "user",
      );
    });

    it("should skip users if auth user creation fails", async () => {
      const tripConfig = {
        key: "trip-with-failed-auth",
        name: "Trip With Failed Auth",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [{ email: "fail@test.com", firstName: "Fail", lastName: "User", role: "user" }];

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Failed Auth" });
      mockCreateAuthUserByEmail.mockResolvedValue(null);
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockUserFindFirst).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should add ghost user as participant", async () => {
      const tripConfig = {
        key: "trip-with-ghost",
        name: "Trip With Ghost",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Ghost" });

      const ghostAuthUser = { id: "auth-ghost", email: "ghost@test.com" };
      const ghostDbUser = { id: "db-ghost", authUserId: "auth-ghost", role: "USER" };

      mockEnsureGhostAuthUser.mockResolvedValue(ghostAuthUser);
      mockUserFindFirst.mockResolvedValue(ghostDbUser);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockTripParticipantUpsert).toHaveBeenCalledWith({
        values: { userId: "db-ghost", tripId: "trip-1" },
        conflictAction: "nothing",
      });

      consoleSpy.mockRestore();
    });

    it("should create ghost DB user if not exists", async () => {
      const tripConfig = {
        key: "trip-with-new-ghost",
        name: "Trip With New Ghost",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With New Ghost" });

      const ghostAuthUser = { id: "auth-ghost", email: "ghost@test.com" };
      const newGhostDbUser = { id: "db-ghost", authUserId: "auth-ghost", role: "USER" };

      mockEnsureGhostAuthUser.mockResolvedValue(ghostAuthUser);
      mockUserFindFirst.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue(newGhostDbUser);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockUserCreate).toHaveBeenCalledWith({
        authUserId: "auth-ghost",
        firstName: "Ghost",
        lastName: "User",
        role: "USER",
      });

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should handle ghost user creation failure", async () => {
      const tripConfig = {
        key: "trip-with-failed-ghost",
        name: "Trip With Failed Ghost",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue([]);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Failed Ghost" });
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      const result = await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(result).toEqual({
        id: "trip-1",
        name: "Trip With Failed Ghost",
        description: "",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-10"),
        backgroundImagePath: undefined,
      });

      consoleSpy.mockRestore();
    });

    it("should handle different role mappings", async () => {
      const tripConfig = {
        key: "trip-with-roles",
        name: "Trip With Roles",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "admin@test.com", firstName: "Admin", lastName: "User", role: "admin" },
        { email: "mod@test.com", firstName: "Mod", lastName: "User", role: "moderator" },
        { email: "service@test.com", firstName: "Service", lastName: "User", role: "service" },
        { email: "user@test.com", firstName: "Regular", lastName: "User", role: "user" },
        { email: "unknown@test.com", firstName: "Unknown", lastName: "User", role: "unknown" },
      ];

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Roles" });
      mockCreateAuthUserByEmail.mockImplementation((email: string) =>
        Promise.resolve({ id: `auth-${email}`, email } as SupabaseUser),
      );
      mockUserFindFirst.mockResolvedValue(null);
      mockUserCreate.mockImplementation(
        (data: { authUserId: string; firstName: string; lastName: string; role: string }) =>
          Promise.resolve({ id: "db-new", ...data }),
      );
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers: AuthUserByEmail = new Map();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      expect(mockUserCreate).toHaveBeenCalledTimes(5);

      const roles = (mockUserCreate.mock.calls as [{ role: string }][]).map((call) => call[0].role);
      expect(roles).toContain("ADMIN");
      expect(roles).toContain("MODERATOR");
      expect(roles).toContain("SERVICE");
      expect(roles).toContain("USER");

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should trim email whitespace", async () => {
      const tripConfig = {
        key: "trip-with-trim",
        name: "Trip With Trim",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/list.csv",
      };

      const users = [
        { email: "  spaced@test.com  ", firstName: "Spaced", lastName: "Email", role: "user" },
      ];

      const authUser = { id: "auth-1", email: "spaced@test.com" } as SupabaseUser;
      const dbUser = { id: "db-1", authUserId: "auth-1", role: "USER" };

      mockReadTextFile.mockResolvedValue("csv content");
      mockParseUsersCsv.mockReturnValue(users);
      mockTripFindFirst.mockResolvedValue(null);
      mockTripCreate.mockResolvedValue({ id: "trip-1", name: "Trip With Trim" });
      mockUserFindFirst.mockResolvedValue(dbUser);
      mockEnsureGhostAuthUser.mockResolvedValue(null);

      const authUsers = new Map([["spaced@test.com", authUser]]);

      await seedTrip(tripConfig, "users/list.csv", "/test/assets/dev", authUsers);

      const call = mockUserFindFirst.mock.calls[0];
      expect(call?.[0]).toMatchObject({ where: expect.any(Function) });
    });
  });
});
