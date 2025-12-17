import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendNotifications } from "../../src/sender";
import type { Prisma } from "@integral-2025-app/db";
import webpush, { WebPushError } from "web-push";

function makeDb(
  overrides: Partial<Prisma.TransactionClient> = {},
): Prisma.TransactionClient {
  const anyDb: any = {
    notification: {
      findUnique: vi.fn(),
    },
    pushSubscription: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    notificationPush: {
      createMany: vi.fn(),
    },
    ...overrides,
  };
  return anyDb as Prisma.TransactionClient;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("sendNotifications", () => {
  it("returns empty failure when notification missing", async () => {
    const db = makeDb();
    (db.notification.findUnique as any).mockResolvedValue(null);

    const res = await sendNotifications(db, "n1");
    expect(res).toEqual({ success: false, sent: 0, failed: 0, total: 0 });
  });

  it("returns zeros when no subscriptions", async () => {
    const db = makeDb();
    (db.notification.findUnique as any).mockResolvedValue({
      id: "n1",
      title: "t",
      body: "b",
      url: "/u",
    });
    (db.pushSubscription.findMany as any).mockResolvedValue([]);

    const res = await sendNotifications(db, "n1");
    expect(res).toEqual({ success: true, sent: 0, failed: 0, total: 0 });
  });

  it("records sent on successful web-push", async () => {
    const db = makeDb();
    (db.notification.findUnique as any).mockResolvedValue({
      id: "n1",
      title: "t",
      body: "b",
      url: "/u",
    });
    (db.pushSubscription.findMany as any).mockResolvedValue([
      { id: "s1", userId: "u1", endpoint: "e", p256dh: "k", auth: "a" },
    ]);

    vi.spyOn(webpush, "sendNotification").mockResolvedValue({
      statusCode: 201,
    } as any);

    const res = await sendNotifications(db, "n1");
    expect(res).toEqual({ success: true, sent: 1, failed: 0, total: 1 });
    expect(db.notificationPush.createMany).toHaveBeenCalledTimes(1);
    const call = (db.notificationPush.createMany as any).mock.calls[0][0];
    expect(call.data[0]).toMatchObject({
      notificationId: "n1",
      targetUserId: "u1",
      status: "sent",
    });
  });

  it("records failed on non-2xx response", async () => {
    const db = makeDb();
    (db.notification.findUnique as any).mockResolvedValue({
      id: "n1",
      title: "t",
      body: "b",
      url: "/u",
    });
    (db.pushSubscription.findMany as any).mockResolvedValue([
      { id: "s1", userId: "u1", endpoint: "e", p256dh: "k", auth: "a" },
    ]);

    vi.spyOn(webpush, "sendNotification").mockResolvedValue({
      statusCode: 500,
    } as any);

    const res = await sendNotifications(db, "n1");
    expect(res).toEqual({ success: false, sent: 0, failed: 1, total: 1 });
    const call = (db.notificationPush.createMany as any).mock.calls[0][0];
    expect(call.data[0]).toMatchObject({
      notificationId: "n1",
      targetUserId: "u1",
      status: "failed",
    });
  });

  it("deletes invalid subscription on 410 and records failed", async () => {
    const db = makeDb();
    (db.notification.findUnique as any).mockResolvedValue({
      id: "n1",
      title: "t",
      body: "b",
      url: "/u",
    });
    (db.pushSubscription.findMany as any).mockResolvedValue([
      { id: "s1", userId: "u1", endpoint: "e", p256dh: "k", auth: "a" },
    ]);

    const error = new WebPushError("Gone", 410, {} as any, "", "");
    vi.spyOn(webpush, "sendNotification").mockRejectedValue(error);

    const res = await sendNotifications(db, "n1");
    expect(res).toEqual({ success: false, sent: 0, failed: 1, total: 1 });
    expect(db.pushSubscription.delete).toHaveBeenCalledWith({
      where: { id: "s1" },
    });
  });
});
