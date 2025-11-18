import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { send, sendRanking } from "../webPush";
import webpush, { WebPushError } from "web-push";
import { NotificationService } from "~/server/services/notificationService";
import { type Prisma } from "@integral-2025-app/db";

jest.mock("web-push");
jest.mock("~/server/services/notificationService");
jest.mock("~/utils/resilience", () => ({
  executeWithRetry: async (
    toExecute: () => Promise<unknown>,
    onError: (err: unknown, retryAttempt: number) => void,
  ) => {
    try {
      return await toExecute();
    } catch (err) {
      onError(err, 0);
      throw err;
    }
  },
}));

type MockPushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};
type MockNotification = { id: string };
type MockGroup = { id: string; name: string; coins: number };

const notificationCreateMock = jest.fn() as jest.MockedFunction<
  (args: unknown) => Promise<MockNotification>
>;
const pushSubscriptionFindManyMock = jest.fn() as jest.MockedFunction<
  () => Promise<MockPushSubscription[]>
>;
const pushSubscriptionDeleteMock = jest.fn() as jest.MockedFunction<
  (args: { where: { id: string } }) => Promise<unknown>
>;
const notificationPushCreateManyMock = jest.fn() as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>;
const groupFindManyMock = jest.fn() as jest.MockedFunction<
  () => Promise<MockGroup[]>
>;
const userFindManyMock = jest.fn() as jest.MockedFunction<
  () => Promise<unknown[]>
>;
const mockWebPush = webpush as jest.Mocked<typeof webpush>;

beforeEach(() => {
  jest.clearAllMocks();

  mockWebPush.sendNotification.mockImplementation(async () => {
    return { statusCode: 201 } as unknown as ReturnType<
      typeof webpush.sendNotification
    >;
  });
  notificationCreateMock.mockResolvedValue({ id: "notif1" });
  pushSubscriptionDeleteMock.mockResolvedValue({});
  notificationPushCreateManyMock.mockResolvedValue({});
});

describe("webPush", () => {
  const mockDb = {
    notification: {
      create: notificationCreateMock,
    },
    pushSubscription: {
      findMany: pushSubscriptionFindManyMock,
      delete: pushSubscriptionDeleteMock,
    },
    notificationPush: {
      createMany: notificationPushCreateManyMock,
    },
    group: {
      findMany: groupFindManyMock,
    },
    user: {
      findMany: userFindManyMock,
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("send", () => {
    const validInput = {
      title: "Test Notification",
      body: "Test Body",
      url: "/test",
      userIds: ["user1", "user2"],
    };

    it("should create notification record even with no subscriptions", async () => {
      pushSubscriptionFindManyMock.mockResolvedValue([]);
      notificationCreateMock.mockResolvedValue({ id: "notif1" });

      const result = await send({
        db: mockDb,
        userId: "sender1",
        input: validInput,
      });

      expect(notificationCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: validInput.title,
          body: validInput.body,
          url: validInput.url,
          createdById: "sender1",
        }),
      });
      expect(result).toEqual({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
      });
    });

    it("should successfully send notifications to all valid subscriptions", async () => {
      const mockSubscriptions = [
        {
          id: "sub1",
          userId: "user1",
          endpoint: "ep1",
          p256dh: "k1",
          auth: "a1",
        },
        {
          id: "sub2",
          userId: "user2",
          endpoint: "ep2",
          p256dh: "k2",
          auth: "a2",
        },
      ];
      pushSubscriptionFindManyMock.mockResolvedValue(mockSubscriptions);

      const result = await send({
        db: mockDb,
        userId: "sender1",
        input: validInput,
      });

      expect(mockWebPush.sendNotification).toHaveBeenCalledTimes(2);
      expect(notificationPushCreateManyMock).toHaveBeenCalledWith({
        data: [
          {
            notificationId: "notif1",
            targetUserId: "user1",
            status: "sent",
            sentAt: expect.any(Date),
          },
          {
            notificationId: "notif1",
            targetUserId: "user2",
            status: "sent",
            sentAt: expect.any(Date),
          },
        ],
      });
      expect(result).toEqual({ success: true, sent: 2, failed: 0, total: 2 });
    });

    it("should delete subscriptions that return 410 Gone", async () => {
      const mockSubscriptions = [
        {
          id: "sub1",
          userId: "user1",
          endpoint: "ep1",
          p256dh: "k1",
          auth: "a1",
        },
      ];
      pushSubscriptionFindManyMock.mockResolvedValue(mockSubscriptions);
      const webPushError = Object.assign(
        new WebPushError("Gone", 410, {}, "Subscription expired", "/test"),
        { statusCode: 410 },
      );
      mockWebPush.sendNotification.mockImplementation(() => {
        throw webPushError;
      });

      const result = await send({
        db: mockDb,
        userId: "sender1",
        input: validInput,
      });

      expect(pushSubscriptionDeleteMock).toHaveBeenCalledWith({
        where: { id: "sub1" },
      });
      expect(notificationPushCreateManyMock).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            notificationId: "notif1",
            targetUserId: "user1",
            status: "failed",
          }),
        ],
      });

      expect(result).toEqual({ success: true, sent: 0, failed: 1, total: 1 });
    });
  });

  describe("sendRanking", () => {
    let createRankingSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      createRankingSpy = jest
        .spyOn(NotificationService, "createRankingUpdateNotification")
        .mockReturnValue({
          title: "Ranking Update",
          body: "Position changed",
          url: "/ranking",
        } as unknown as ReturnType<
          typeof NotificationService.createRankingUpdateNotification
        >);
    });

    it("should send ranking updates to group members", async () => {
      const mockGroups = [
        { id: "g1", name: "Group 1", coins: 100 },
        { id: "g2", name: "Group 2", coins: 50 },
      ];
      const mockUsers = [{ id: "user1" }, { id: "user2" }];
      groupFindManyMock.mockResolvedValue(mockGroups);
      userFindManyMock.mockResolvedValue(mockUsers);
      pushSubscriptionFindManyMock.mockResolvedValue([
        {
          id: "sub1",
          userId: "user1",
          endpoint: "ep1",
          p256dh: "k1",
          auth: "a1",
        },
      ]);
      notificationCreateMock.mockResolvedValue({ id: "notif1" });
      const okSendResult = {} as Awaited<
        ReturnType<typeof webpush.sendNotification>
      >;
      mockWebPush.sendNotification.mockResolvedValue(okSendResult);

      const result = await sendRanking({
        db: mockDb,
        userId: "sender1",
      });

      expect(createRankingSpy).toHaveBeenCalledWith("Group 1", 1);
      expect(createRankingSpy).toHaveBeenCalledWith("Group 2", 2);
      expect(result).toEqual({
        success: true,
        sent: expect.any(Number),
        failed: 0,
        total: expect.any(Number),
      });
    });
  });
});
