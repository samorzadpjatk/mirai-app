import { describe, expect, it, vi } from "vitest";
import {
  LOCATION_REALTIME_TABLE,
  buildFriendLocationFilter,
  createChannelSubscriptionGate,
  extractRealtimeUserId,
  shouldKeepStreaming,
} from "../realtime";

describe("location realtime helpers", () => {
  describe("LOCATION_REALTIME_TABLE", () => {
    it("targets the Drizzle table, not the dropped legacy Prisma table", () => {
      expect(LOCATION_REALTIME_TABLE).toBe("locations");
      expect(LOCATION_REALTIME_TABLE).not.toBe("Location");
    });
  });

  describe("buildFriendLocationFilter", () => {
    it("filters on the physical snake_case column", () => {
      expect(buildFriendLocationFilter(["a", "b"])).toBe("user_id=in.(a,b)");
    });

    it("never emits the Drizzle field name", () => {
      expect(buildFriendLocationFilter(["a"])).not.toContain("userId");
    });
  });

  describe("extractRealtimeUserId", () => {
    it("reads user_id from the new row for inserts and updates", () => {
      expect(extractRealtimeUserId({ eventType: "INSERT", new: { user_id: "u1" } })).toBe("u1");
      expect(extractRealtimeUserId({ eventType: "UPDATE", new: { user_id: "u2" } })).toBe("u2");
    });

    it("reads user_id from the old row for deletes", () => {
      expect(extractRealtimeUserId({ eventType: "DELETE", old: { user_id: "u3" }, new: {} })).toBe(
        "u3",
      );
    });

    it("returns null when the payload carries no usable user id", () => {
      expect(extractRealtimeUserId({ eventType: "UPDATE", new: {} })).toBeNull();
      expect(extractRealtimeUserId({ eventType: "UPDATE", new: null })).toBeNull();
      expect(extractRealtimeUserId({ eventType: "DELETE", old: undefined })).toBeNull();
      expect(extractRealtimeUserId({ eventType: "UPDATE", new: { user_id: "" } })).toBeNull();
      expect(extractRealtimeUserId({ eventType: "UPDATE", new: { user_id: 42 } })).toBeNull();
    });

    it("ignores the camelCase field the legacy subscription relied on", () => {
      expect(extractRealtimeUserId({ eventType: "UPDATE", new: { userId: "u1" } })).toBeNull();
    });
  });

  describe("shouldKeepStreaming", () => {
    it("keeps streaming while the channel is still joining", () => {
      expect(shouldKeepStreaming({ state: "joining" })).toBe(true);
    });

    it("keeps streaming once the channel has joined", () => {
      expect(shouldKeepStreaming({ state: "joined" })).toBe(true);
    });

    it("stops once the channel is gone", () => {
      expect(shouldKeepStreaming({ state: "closed" })).toBe(false);
      expect(shouldKeepStreaming({ state: "errored" })).toBe(false);
      expect(shouldKeepStreaming({ state: "leaving" })).toBe(false);
    });

    it("stops when there is no channel at all", () => {
      expect(shouldKeepStreaming(null)).toBe(false);
      expect(shouldKeepStreaming(undefined)).toBe(false);
      expect(shouldKeepStreaming({})).toBe(false);
    });
  });

  describe("createChannelSubscriptionGate", () => {
    it("resolves true once SUBSCRIBED arrives", async () => {
      const gate = createChannelSubscriptionGate(1000);
      gate.onStatus("SUBSCRIBED");
      await expect(gate.wait()).resolves.toBe(true);
    });

    it("ignores unrelated statuses until SUBSCRIBED arrives", async () => {
      const gate = createChannelSubscriptionGate(1000);
      gate.onStatus("JOINING");
      gate.onStatus("SUBSCRIBED");
      await expect(gate.wait()).resolves.toBe(true);
    });

    it.each(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"])("resolves false on %s", async (status) => {
      const gate = createChannelSubscriptionGate(1000);
      gate.onStatus(status);
      await expect(gate.wait()).resolves.toBe(false);
    });

    it("resolves false when the join handshake never completes", async () => {
      vi.useFakeTimers();
      try {
        const gate = createChannelSubscriptionGate(50);
        const pending = gate.wait();
        await vi.advanceTimersByTimeAsync(60);
        await expect(pending).resolves.toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("keeps the first outcome when later statuses arrive", async () => {
      const gate = createChannelSubscriptionGate(1000);
      gate.onStatus("SUBSCRIBED");
      gate.onStatus("CHANNEL_ERROR");
      await expect(gate.wait()).resolves.toBe(true);
    });
  });
});
