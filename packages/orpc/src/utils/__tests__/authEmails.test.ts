import { noop } from "@mirai-app/common/test-utils";
import type { SupabaseClient } from "@mirai-app/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthEmailLookup, buildAuthUserSummaryLookup, resolveAuthEmail } from "../authEmails";

describe("authEmails", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        admin: {
          getUserById: vi.fn(),
        },
      },
    } satisfies SupabaseClient;

    vi.spyOn(console, "warn").mockImplementation(noop);
  });

  describe("buildAuthEmailLookup", () => {
    it("should return empty map for empty input array", async () => {
      const result = await buildAuthEmailLookup(mockSupabase, []);
      expect(result.size).toBe(0);
    });

    it("should return empty map for array with only null/undefined values", async () => {
      const result = await buildAuthEmailLookup(mockSupabase, [null, undefined, null]);
      expect(result.size).toBe(0);
    });

    it("should fetch email for single user ID", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
          },
        },
        error: null,
      });

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBe("user1@example.com");

      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith("user-1");
    });

    it("should fetch emails for multiple user IDs", async () => {
      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: { user: { id: "user-1", email: "user1@example.com" } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { id: "user-2", email: "user2@example.com" } },
          error: null,
        });

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1", "user-2"]);

      expect(result.get("user-1")).toBe("user1@example.com");
      expect(result.get("user-2")).toBe("user2@example.com");
    });

    it("should deduplicate user IDs", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-1", email: "user1@example.com" } },
        error: null,
      });

      await buildAuthEmailLookup(mockSupabase, ["user-1", "user-1", "user-1"]);

      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledTimes(1);
    });

    it("should handle null email in response", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-1", email: null } },
        error: null,
      });

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBeNull();
    });

    it("should handle user not found", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBeNull();
    });

    it("should handle API error and log warning", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: "User not found" },
      });

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        "[Auth] Failed to fetch auth user user-1: User not found",
        { authUserId: "user-1", error: "User not found" },
      );
    });

    it("should filter out null/undefined IDs and process valid ones", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-1", email: "user1@example.com" } },
        error: null,
      });

      const result = await buildAuthEmailLookup(mockSupabase, [null, "user-1", undefined]);

      expect(result.size).toBe(1);
      expect(result.get("user-1")).toBe("user1@example.com");
    });
  });

  describe("buildAuthUserSummaryLookup", () => {
    it("should return empty map for empty input array", async () => {
      const result = await buildAuthUserSummaryLookup(mockSupabase, []);
      expect(result.size).toBe(0);
    });

    it("should return empty map for array with only null/undefined values", async () => {
      const result = await buildAuthUserSummaryLookup(mockSupabase, [null, undefined]);
      expect(result.size).toBe(0);
    });

    it("should build summary for active user", async () => {
      const futureBanDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
            banned_until: futureBanDate,
            app_metadata: { ban_reason: "Violation" },
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary).toEqual({
        email: "user1@example.com",
        bannedUntil: futureBanDate,
        banReason: "Violation",
        isBanned: true,
      });
    });

    it("should build summary for non-banned user", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
            banned_until: null,
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary).toEqual({
        email: "user1@example.com",
        bannedUntil: "",
        banReason: "",
        isBanned: false,
      });
    });

    it("should build summary for user with expired ban", async () => {
      const pastBanDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
            banned_until: pastBanDate,
            app_metadata: { ban_reason: "Old violation" },
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary?.isBanned).toBe(false);
      expect(summary?.bannedUntil).toBe(pastBanDate);
    });

    it("should handle user with empty banned_until string", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
            banned_until: "",
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary?.bannedUntil).toBe("");
      expect(summary?.isBanned).toBe(false);
    });

    it("should handle user with invalid ban date", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
            banned_until: "invalid-date",
            app_metadata: { ban_reason: "Test" },
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary?.isBanned).toBe(false);
    });

    it("should handle API error with default summary", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: "API Error" },
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary).toEqual({
        email: "",
        bannedUntil: "",
        banReason: "",
        isBanned: false,
      });
      expect(console.warn).toHaveBeenCalledWith(
        "[Auth] Failed to fetch auth user user-1: API Error",
        { authUserId: "user-1", error: "API Error" },
      );
    });

    it("should handle null email in summary", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: null,
            banned_until: null,
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary).toEqual({
        email: "",
        bannedUntil: "",
        banReason: "",
        isBanned: false,
      });
    });

    it("should deduplicate user IDs", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "user1@example.com",
            banned_until: null,
            app_metadata: {},
          },
        },
        error: null,
      });

      await buildAuthUserSummaryLookup(mockSupabase, ["user-1", "user-1"]);

      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple users with mixed ban statuses", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: {
            user: {
              id: "user-1",
              email: "user1@example.com",
              banned_until: null,
              app_metadata: {},
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            user: {
              id: "user-2",
              email: "user2@example.com",
              banned_until: futureDate,
              app_metadata: { ban_reason: "Banned" },
            },
          },
          error: null,
        });

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1", "user-2"]);

      expect(result.get("user-1")?.isBanned).toBe(false);
      expect(result.get("user-2")?.isBanned).toBe(true);
    });
  });

  describe("resolveAuthEmail", () => {
    it("should return email for existing user ID", () => {
      const lookup = new Map([
        ["user-1", "user1@example.com"],
        ["user-2", "user2@example.com"],
      ]);

      const result = resolveAuthEmail(lookup, "user-1");

      expect(result).toBe("user1@example.com");
    });

    it("should return empty string for non-existing user ID", () => {
      const lookup = new Map([["user-1", "user1@example.com"]]);

      const result = resolveAuthEmail(lookup, "user-2");

      expect(result).toBe("");
    });

    it("should return empty string for null authUserId", () => {
      const lookup = new Map([["user-1", "user1@example.com"]]);

      const result = resolveAuthEmail(lookup, null);

      expect(result).toBe("");
    });

    it("should return empty string for undefined authUserId", () => {
      const lookup = new Map([["user-1", "user1@example.com"]]);

      const result = resolveAuthEmail(lookup, undefined);

      expect(result).toBe("");
    });

    it("should return empty string when email in lookup is null", () => {
      const lookup = new Map([["user-1", null]]);

      const result = resolveAuthEmail(lookup, "user-1");

      expect(result).toBe("");
    });

    it("should handle empty lookup map", () => {
      const lookup = new Map<string, string | null>();

      const result = resolveAuthEmail(lookup, "user-1");

      expect(result).toBe("");
    });
  });
});
