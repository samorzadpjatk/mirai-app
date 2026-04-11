import { describe, it, expect, mock, beforeEach } from "bun:test";
import { NotificationService } from "../notification-service";
import type { NotificationRepository } from "@mirai-app/use-cases";
import type { Notification, NotificationId } from "@mirai-app/domain";

// Mock Notification
const createMockNotification = (
  overrides?: Partial<Notification>,
): Notification =>
  ({
    id: "notif-123" as NotificationId,
    tripId: "trip-123",
    title: "Test Notification",
    body: "Test body",
    url: null,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }) as Notification;

describe("[UNIT] NotificationService", () => {
  let service: NotificationService;
  let mockNotificationRepository: NotificationRepository;

  beforeEach(() => {
    mockNotificationRepository = {
      findById: mock(() => Promise.resolve(createMockNotification())),
      findByTripId: mock(() => Promise.resolve([createMockNotification()])),
      create: mock((notif: Notification) => Promise.resolve(notif)),
      delete: mock(() => Promise.resolve()),
    } as unknown as NotificationRepository;

    service = new NotificationService(mockNotificationRepository);
  });

  describe("getById", () => {
    it("should return notification by ID", async () => {
      const result = await service.getById("notif-123");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Notification");
    });

    it("should return null when not found", async () => {
      mockNotificationRepository.findById = mock(() => Promise.resolve(null));

      const result = await service.getById("notif-123");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create notification", async () => {
      const input = {
        tripId: "trip-123",
        title: "New Notification",
        body: "New body",
      };

      const result = await service.create(input);

      expect(result).not.toBeNull();
      expect(result?.title).toBe("New Notification");
      expect(mockNotificationRepository.create).toHaveBeenCalled();
    });
  });

  describe("getByTripId", () => {
    it("should return notifications for trip", async () => {
      const result = await service.getByTripId("trip-123");

      expect(result).toHaveLength(1);
    });
  });
});
