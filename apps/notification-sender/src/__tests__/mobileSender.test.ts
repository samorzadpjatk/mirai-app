import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMobileNotifications } from "../mobileSender";

// Mock expo-server-sdk
vi.mock("expo-server-sdk", () => {
  class ExpoMock {
    static isExpoPushToken(token: string) {
      return token.startsWith("ExpoPushToken[");
    }
    chunkPushNotifications(msgs: any[]) {
      return [msgs];
    }
    async sendPushNotificationsAsync(chunk: any[]) {
      return chunk.map(() => ({ status: "ok" }));
    }
  }
  return { Expo: ExpoMock };
});

const createMockDb = () => {
  return {
    notification: {
      findUnique: vi.fn(),
    },
    mobilePushSubscription: {
      findMany: vi.fn(),
    },
    notificationPush: {
      createMany: vi.fn(),
    },
  } as any;
};

describe("sendMobileNotifications", () => {
  let db: any;

  beforeEach(() => {
    db = createMockDb();
  });

  it("returns failure when notification not found", async () => {
    db.notification.findUnique.mockResolvedValueOnce(null);
    const res = await sendMobileNotifications(db, "n-1");
    expect(res).toEqual({ success: false, sent: 0, failed: 0, total: 0 });
  });

  it("returns success with zero when no subscriptions", async () => {
    db.notification.findUnique.mockResolvedValueOnce({
      id: "n-1",
      title: "t",
      body: "b",
      url: "/u",
    });
    db.mobilePushSubscription.findMany.mockResolvedValueOnce([]);
    const res = await sendMobileNotifications(db, "n-1");
    expect(res).toEqual({ success: true, sent: 0, failed: 0, total: 0 });
    expect(db.notificationPush.createMany).not.toHaveBeenCalled();
  });

  it("filters non-expo tokens and sends to expo", async () => {
    db.notification.findUnique.mockResolvedValueOnce({
      id: "n-2",
      title: "Hello",
      body: "World",
      url: "/x",
    });
    db.mobilePushSubscription.findMany.mockResolvedValueOnce([
      { userId: "u1", platform: "expo", token: "ExpoPushToken[abc]" },
      { userId: "u2", platform: "fcm", token: "fcm-token" },
      { userId: "u3", platform: "expo", token: "ExpoPushToken[def]" },
      { userId: "u4", platform: "expo", token: "invalid-token" },
    ]);
    const res = await sendMobileNotifications(db, "n-2");
    expect(res).toEqual({ success: true, sent: 2, failed: 0, total: 2 });
    expect(db.notificationPush.createMany).toHaveBeenCalledTimes(1);
    const payload = db.notificationPush.createMany.mock.calls[0][0].data;
    expect(payload.filter((p: any) => p.status === "sent").length).toBe(2);
  });

  it("records failures on network error", async () => {
    // Remock send to throw
    const { Expo } = await import("expo-server-sdk");
    (Expo.prototype as any).sendPushNotificationsAsync = vi.fn(async () => {
      throw new Error("network error");
    });

    db.notification.findUnique.mockResolvedValueOnce({
      id: "n-3",
      title: "Hi",
      body: "There",
      url: "/y",
    });
    db.mobilePushSubscription.findMany.mockResolvedValueOnce([
      { userId: "u1", platform: "expo", token: "ExpoPushToken[abc]" },
    ]);

    const res = await sendMobileNotifications(db, "n-3");
    expect(res).toEqual({ success: false, sent: 0, failed: 1, total: 1 });
    expect(db.notificationPush.createMany).toHaveBeenCalledTimes(1);
    const payload = db.notificationPush.createMany.mock.calls[0][0].data;
    expect(payload[0]).toMatchObject({
      status: "failed",
      failureReason: "expo",
    });
  });
});
