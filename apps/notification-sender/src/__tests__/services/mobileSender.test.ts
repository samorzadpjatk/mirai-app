import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMobileNotifications } from "../../services/mobileSender";
import type { Prisma } from "@integral-2025-app/db";

// Mock expo-server-sdk
vi.mock("expo-server-sdk", () => {
  class ExpoMock {
    static isExpoPushToken(token: string) {
      return token.startsWith("ExpoPushToken[");
    }
    chunkPushNotifications(msgs: unknown[]) {
      return [msgs];
    }
    sendPushNotificationsAsync(_chunk: unknown[]) {
      return Promise.resolve(_chunk.map(() => ({ status: "ok" })));
    }
  }
  return { Expo: ExpoMock };
});

const createMockDb = (): Prisma.TransactionClient => {
  return {
    notification: {
      findUnique: vi.fn(),
    },
    pushSubscription: {
      findMany: vi.fn(),
    },
    notificationPush: {
      createMany: vi.fn(),
    },
  } as unknown as Prisma.TransactionClient;
};

describe("sendMobileNotifications", () => {
  let db: Prisma.TransactionClient;

  beforeEach(() => {
    db = createMockDb();
  });

  it("returns failure when notification not found", async () => {
    (
      db.notification.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    const res = await sendMobileNotifications(db, "n-1");
    expect(res).toEqual({ success: false, sent: 0, failed: 0, total: 0 });
  });

  it("returns success with zero when no subscriptions", async () => {
    (
      db.notification.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "n-1",
      title: "t",
      body: "b",
      url: "/u",
    });
    (
      db.pushSubscription.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([]);
    const res = await sendMobileNotifications(db, "n-1");
    expect(res).toEqual({ success: true, sent: 0, failed: 0, total: 0 });
    expect(db.notificationPush.createMany).not.toHaveBeenCalled();
  });

  it("filters non-expo tokens and sends to expo", async () => {
    (
      db.notification.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "n-2",
      title: "Hello",
      body: "World",
      url: "/x",
    });
    (
      db.pushSubscription.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      { userId: "u1", token: "ExpoPushToken[abc]" },
      { userId: "u2", token: "fcm-token" },
      { userId: "u3", token: "ExpoPushToken[def]" },
      { userId: "u4", token: "invalid-token" },
    ]);
    const res = await sendMobileNotifications(db, "n-2");
    expect(res).toEqual({ success: true, sent: 2, failed: 0, total: 2 });
    const createManyMock = db.notificationPush.createMany as ReturnType<
      typeof vi.fn
    >;
    expect(createManyMock).toHaveBeenCalledTimes(1);
    const calls = createManyMock.mock.calls as [
      { data: { status: string }[] },
    ][];
    const payload = calls[0]?.[0]?.data ?? [];
    const sentCount = payload.filter((p) => p.status === "sent").length;
    expect(sentCount).toBe(2);
  });

  it("records failures on network error", async () => {
    // Remock send to throw
    const { Expo } = await import("expo-server-sdk");
    (Expo.prototype.sendPushNotificationsAsync as unknown as ReturnType<
      typeof vi.fn
    >) = vi.fn(() => {
      return Promise.reject(new Error("network error"));
    });

    (
      db.notification.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "n-3",
      title: "Hi",
      body: "There",
      url: "/y",
    });
    (
      db.pushSubscription.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([{ userId: "u1", token: "ExpoPushToken[abc]" }]);

    const res = await sendMobileNotifications(db, "n-3");
    expect(res).toEqual({ success: false, sent: 0, failed: 1, total: 1 });
    const createManyMock = db.notificationPush.createMany as ReturnType<
      typeof vi.fn
    >;
    expect(createManyMock).toHaveBeenCalledTimes(1);
    const calls = createManyMock.mock.calls as [
      { data: { status: string; failureReason?: string }[] },
    ][];
    const payload = calls[0]?.[0]?.data ?? [];
    const firstItem = payload.length > 0 ? payload[0] : null;
    expect(firstItem).toMatchObject({
      status: "failed",
      failureReason: "expo",
    });
  });
});
