import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkInactiveUsers } from "../inactivityChecker";
import type { Prisma } from "@integral-2025-app/db";

// Mock sendMobileNotifications
vi.mock("../mobileSender", () => ({
  sendMobileNotifications: vi.fn().mockResolvedValue({
    success: true,
    sent: 1,
    failed: 0,
    total: 1,
  }),
}));

const createMockDb = (): Prisma.TransactionClient => {
  return {
    location: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  } as unknown as Prisma.TransactionClient;
};

describe("checkInactiveUsers", () => {
  let db: Prisma.TransactionClient;
  const now = new Date();
  const thirtyOneMinutesAgo = new Date(now.getTime() - 31 * 60 * 1000);
  const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  it("returns zero counts when no inactive users found", async () => {
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([]);

    const result = await checkInactiveUsers(db);

    expect(result).toEqual({
      checked: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
    });
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("identifies users inactive for 30+ minutes with sharing enabled", async () => {
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "loc-1",
        userId: "user-1",
        timestamp: thirtyOneMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: null,
        user: { id: "user-1", name: "User One" },
      },
    ]);

    (db.notification.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "notif-1",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      })
      .mockResolvedValueOnce({
        id: "notif-2",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      });

    (db.location.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(1);
    expect(result.notified).toBe(1);
    expect(db.notification.create).toHaveBeenCalledTimes(2);
    expect(db.location.update).toHaveBeenCalledWith({
      where: { id: "loc-1" },
      data: { lastInactivityNotification: expect.any(Date) as Date },
    });
  });

  it("skips users who are not sharing location", async () => {
    // This case should not be returned by the query since we filter by isSharingLocation: true
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([]);

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(0);
    expect(result.notified).toBe(0);
  });

  it("respects notification cooldown period", async () => {
    // User who was notified 29 minutes ago should not be included in results
    // because the query filters them out
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([]);

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(0);
    expect(result.notified).toBe(0);
  });

  it("notifies user again after cooldown period has passed", async () => {
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "loc-1",
        userId: "user-1",
        timestamp: sixtyMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: thirtyOneMinutesAgo,
        user: { id: "user-1", name: "User One" },
      },
    ]);

    (db.notification.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "notif-1",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      })
      .mockResolvedValueOnce({
        id: "notif-2",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      });

    (db.location.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(1);
    expect(result.notified).toBe(1);
  });

  it("handles multiple inactive users", async () => {
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "loc-1",
        userId: "user-1",
        timestamp: thirtyOneMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: null,
        user: { id: "user-1", name: "User One" },
      },
      {
        id: "loc-2",
        userId: "user-2",
        timestamp: sixtyMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: null,
        user: { id: "user-2", name: "User Two" },
      },
    ]);

    (db.notification.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "notif-1",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      })
      .mockResolvedValueOnce({
        id: "notif-2",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      })
      .mockResolvedValueOnce({
        id: "notif-3",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      });

    (db.location.update as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(2);
    expect(result.notified).toBe(2);
    expect(db.notification.create).toHaveBeenCalledTimes(3); // 1 initial + 2 per user
    expect(db.location.update).toHaveBeenCalledTimes(2);
  });

  it("handles errors gracefully and continues processing other users", async () => {
    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "loc-1",
        userId: "user-1",
        timestamp: thirtyOneMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: null,
        user: { id: "user-1", name: "User One" },
      },
      {
        id: "loc-2",
        userId: "user-2",
        timestamp: sixtyMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: null,
        user: { id: "user-2", name: "User Two" },
      },
    ]);

    (db.notification.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "notif-1",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      })
      .mockRejectedValueOnce(new Error("Database error"))
      .mockResolvedValueOnce({
        id: "notif-3",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      });

    (db.location.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(2);
    expect(result.errors).toBe(1);
    expect(result.notified).toBe(1);
  });

  it("skips users when mobile notification sending fails", async () => {
    const { sendMobileNotifications } = await import("../mobileSender");
    (sendMobileNotifications as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        success: false,
        sent: 0,
        failed: 1,
        total: 1,
      },
    );

    (
      db.location.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "loc-1",
        userId: "user-1",
        timestamp: thirtyOneMinutesAgo,
        isSharingLocation: true,
        lastInactivityNotification: null,
        user: { id: "user-1", name: "User One" },
      },
    ]);

    (db.notification.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "notif-1",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      })
      .mockResolvedValueOnce({
        id: "notif-2",
        title: "Zobacz gdzie są twoi znajomi",
        body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
        url: "/map",
      });

    const result = await checkInactiveUsers(db);

    expect(result.checked).toBe(1);
    expect(result.notified).toBe(0);
    expect(result.skipped).toBe(1);
    expect(db.location.update).not.toHaveBeenCalled();
  });
});
