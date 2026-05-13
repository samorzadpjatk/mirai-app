 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildAuthEmailLookup,
  buildAuthUserSummaryLookup,
  resolveAuthEmail,
} from "../authEmails";
import type { SupabaseClient } from "@mirai-app/supabase";
import { noop } from "@mirai-app/shared/test-utils";

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
    } as unknown as SupabaseClient;

    vi.spyOn(console, "warn").mockImplementation(noop);
  });

  describe("buildAuthEmailLookup", () => {
    it("should return empty map for empty input array", async () => {
      const result = await buildAuthEmailLookup(mockSupabase, []);
      expect(result.size).toBe(0);
    });

    it("should return empty map for array with only null/undefined values", async () => {
      const result = await buildAuthEmailLookup(mockSupabase, [
        null,
        undefined,
        null,
      ]);
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
      } as never);

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBe("user1@example.com");
       
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith(
        "user-1"
      );
    });

    it("should fetch emails for multiple user IDs", async () => {
       
      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: { user: { id: "user-1", email: "user1@example.com" } },
          error: null,
        } as never)
        .mockResolvedValueOnce({
          data: { user: { id: "user-2", email: "user2@example.com" } },
          error: null,
        } as never);

      const result = await buildAuthEmailLookup(mockSupabase, [
        "user-1",
        "user-2",
      ]);

      expect(result.get("user-1")).toBe("user1@example.com");
      expect(result.get("user-2")).toBe("user2@example.com");
    });

    it("should deduplicate user IDs", async () => {
       
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-1", email: "user1@example.com" } },
        error: null,
      } as never);

      await buildAuthEmailLookup(mockSupabase, [
        "user-1",
        "user-1",
        "user-1",
      ]);

       
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledTimes(1);
    });

    it("should handle null email in response", async () => {
       
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-1", email: null } },
        error: null,
      } as never);

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBeNull();
    });

    it("should handle user not found", async () => {
       
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBeNull();
    });

    it("should handle API error and log warning", async () => {
       
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: "User not found" },
      } as never);

      const result = await buildAuthEmailLookup(mockSupabase, ["user-1"]);

      expect(result.get("user-1")).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        "[Auth] Failed to fetch auth user user-1: User not found"
      );
    });

    it("should filter out null/undefined IDs and process valid ones", async () => {
       
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-1", email: "user1@example.com" } },
        error: null,
      } as never);

      const result = await buildAuthEmailLookup(mockSupabase, [
        null,
        "user-1",
        undefined,
      ]);

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
      const result = await buildAuthUserSummaryLookup(mockSupabase, [
        null,
        undefined,
      ]);
      expect(result.size).toBe(0);
    });

    it("should build summary for active user", async () => {
      const futureBanDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

       
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
      } as never);

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
      } as never);

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary).toEqual({
        email: "user1@example.com",
        bannedUntil: null,
        banReason: null,
        isBanned: false,
      });
    });

    it("should build summary for user with expired ban", async () => {
      const pastBanDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

       
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
      } as never);

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
      } as never);

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary?.bannedUntil).toBeNull();
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
      } as never);

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary?.isBanned).toBe(false);
    });

    it("should handle API error with default summary", async () => {
       
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: "API Error" },
      } as never);

      const result = await buildAuthUserSummaryLookup(mockSupabase, ["user-1"]);
      const summary = result.get("user-1");

      expect(summary).toEqual({
        email: null,
        bannedUntil: null,
        banReason: null,
        isBanned: false,
      });
      expect(console.warn).toHaveBeenCalledWith(
        "[Auth] Failed to fetch auth user user-1: API Error"
      );
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
      } as never);

      await buildAuthUserSummaryLookup(mockSupabase, ["user-1", "user-1"]);

       
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple users with mixed ban statuses", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

       
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
        } as never)
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
        } as never);

      const result = await buildAuthUserSummaryLookup(mockSupabase, [
        "user-1",
        "user-2",
      ]);

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

    it("should return null for non-existing user ID", () => {
      const lookup = new Map([["user-1", "user1@example.com"]]);

      const result = resolveAuthEmail(lookup, "user-2");

      expect(result).toBeNull();
    });

    it("should return null for null authUserId", () => {
      const lookup = new Map([["user-1", "user1@example.com"]]);

      const result = resolveAuthEmail(lookup, null);

      expect(result).toBeNull();
    });

    it("should return null for undefined authUserId", () => {
      const lookup = new Map([["user-1", "user1@example.com"]]);

      const result = resolveAuthEmail(lookup, undefined);

      expect(result).toBeNull();
    });

    it("should return null when email in lookup is null", () => {
      const lookup = new Map([["user-1", null]]);

      const result = resolveAuthEmail(lookup, "user-1");

      expect(result).toBeNull();
    });

    it("should handle empty lookup map", () => {
      const lookup = new Map<string, string | null>();

      const result = resolveAuthEmail(lookup, "user-1");

      expect(result).toBeNull();
    });
  });
});
