import { describe, expect, test, mock } from "bun:test";
import {
  buildAuthEmailLookup,
  buildAuthUserSummaryLookup,
  resolveAuthEmail,
} from "../authEmails";

const mockSupabaseClient = () => {
  return {
    auth: {
      admin: {
        getUserById: mock(),
      },
    },
  } as any;
};

describe("[UNIT] authEmails", () => {
  describe("buildAuthEmailLookup", () => {
    test("returns empty map for empty input", async () => {
      const supabase = mockSupabaseClient();
      const result = await buildAuthEmailLookup(supabase, []);
      expect(result.size).toBe(0);
    });

    test("filters out null and undefined values from input", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockImplementation(
        async (userId: string) => {
          if (userId === "user1") {
            return {
              data: { user: { email: "test@example.com" } },
              error: null,
            };
          }
          if (userId === "user2") {
            return { data: { user: null }, error: null };
          }
          return { data: null, error: null };
        },
      );

      const result = await buildAuthEmailLookup(supabase, [
        "user1",
        null,
        undefined,
        "user2",
      ]);
      expect(result.size).toBe(2);
      expect(result.get("user1")).toBe("test@example.com");
      expect(result.get("user2")).toBeNull();
    });

    test("returns unique emails for duplicate user IDs", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const result = await buildAuthEmailLookup(supabase, [
        "user1",
        "user1",
        "user1",
      ]);
      expect(result.size).toBe(1);
      expect(supabase.auth.admin.getUserById).toHaveBeenCalledTimes(1);
    });

    test("maps user ID to email when found", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { email: "user1@example.com" } },
        error: null,
      });

      const result = await buildAuthEmailLookup(supabase, ["user1"]);
      expect(result.get("user1")).toBe("user1@example.com");
    });

    test("maps user ID to null when user not found", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "User not found" },
      });

      const result = await buildAuthEmailLookup(supabase, ["unknown-user"]);
      expect(result.get("unknown-user")).toBeNull();
    });

    test("maps user ID to null when error occurs", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const result = await buildAuthEmailLookup(supabase, ["user1"]);
      expect(result.get("user1")).toBeNull();
    });

    test("handles multiple users", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: { user: { email: "user1@example.com" } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { email: "user2@example.com" } },
          error: null,
        });

      const result = await buildAuthEmailLookup(supabase, ["user1", "user2"]);
      expect(result.get("user1")).toBe("user1@example.com");
      expect(result.get("user2")).toBe("user2@example.com");
    });
  });

  describe("buildAuthUserSummaryLookup", () => {
    test("returns empty map for empty input", async () => {
      const supabase = mockSupabaseClient();
      const result = await buildAuthUserSummaryLookup(supabase, []);
      expect(result.size).toBe(0);
    });

    test("returns summary with isBanned false for non-banned user", async () => {
      const supabase = mockSupabaseClient();
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            email: "user1@example.com",
            banned_until: futureDate,
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(supabase, ["user1"]);
      const summary = result.get("user1");
      expect(summary).toBeDefined();
      expect(summary?.email).toBe("user1@example.com");
      expect(summary?.isBanned).toBe(true);
      expect(summary?.bannedUntil).toBe(futureDate);
    });

    test("returns summary with isBanned false for past ban", async () => {
      const supabase = mockSupabaseClient();
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            email: "user1@example.com",
            banned_until: pastDate,
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(supabase, ["user1"]);
      const summary = result.get("user1");
      expect(summary?.isBanned).toBe(false);
    });

    test("extracts ban reason from app_metadata", async () => {
      const supabase = mockSupabaseClient();
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            email: "user1@example.com",
            banned_until: futureDate,
            app_metadata: { ban_reason: "Spam" },
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(supabase, ["user1"]);
      const summary = result.get("user1");
      expect(summary?.banReason).toBe("Spam");
    });

    test("returns default summary on error", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const result = await buildAuthUserSummaryLookup(supabase, ["user1"]);
      const summary = result.get("user1");
      expect(summary?.email).toBeNull();
      expect(summary?.isBanned).toBe(false);
      expect(summary?.bannedUntil).toBeNull();
      expect(summary?.banReason).toBeNull();
    });

    test("handles empty banned_until string as null", async () => {
      const supabase = mockSupabaseClient();
      supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            email: "user1@example.com",
            banned_until: "",
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(supabase, ["user1"]);
      const summary = result.get("user1");
      expect(summary?.bannedUntil).toBeNull();
      expect(summary?.isBanned).toBe(false);
    });
  });

  describe("resolveAuthEmail", () => {
    test("returns null for undefined authUserId", () => {
      const map = new Map<string, string | null>();
      expect(resolveAuthEmail(map, undefined)).toBeNull();
    });

    test("returns null for null authUserId", () => {
      const map = new Map<string, string | null>();
      expect(resolveAuthEmail(map, null)).toBeNull();
    });

    test("returns email when found in map", () => {
      const map = new Map<string, string | null>([
        ["user1", "test@example.com"],
      ]);
      expect(resolveAuthEmail(map, "user1")).toBe("test@example.com");
    });

    test("returns null when user not found in map", () => {
      const map = new Map<string, string | null>([
        ["user1", "test@example.com"],
      ]);
      expect(resolveAuthEmail(map, "user2")).toBeNull();
    });

    test("returns null when user maps to null", () => {
      const map = new Map<string, string | null>([["user1", null]]);
      expect(resolveAuthEmail(map, "user1")).toBeNull();
    });
  });
});
