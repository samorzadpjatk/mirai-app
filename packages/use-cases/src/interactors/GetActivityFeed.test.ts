import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetActivityFeedUseCase,
  type GetActivityFeedInput,
} from "./GetActivityFeed";
import type { ActivityFeedRepository } from "../ports/ActivityFeedRepository";
import type { ActivityFeed, ActivityId } from "@mirai-app/domain";

// Mock ActivityFeed domain object
const createMockActivity = (overrides?: Partial<ActivityFeed>): ActivityFeed =>
  ({
    id: "activity-123" as ActivityId,
    tripId: "trip-123",
    activityType: "custom",
    title: "Test Activity",
    description: "Test description",
    imageUrl: "image.jpg",
    isPinned: false,
    isHidden: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    admin: {
      id: "admin-123",
      firstName: "John",
      lastName: "Doe",
    },
    ...overrides,
  }) as ActivityFeed;

describe("[UNIT] GetActivityFeedUseCase", () => {
  let useCase: GetActivityFeedUseCase;
  let mockActivityFeedRepository: ActivityFeedRepository;

  beforeEach(() => {
    mockActivityFeedRepository = {
      findByTripId: mock(() =>
        Promise.resolve({
          activities: [],
          nextCursor: null,
          hasMore: false,
        }),
      ),
    } as unknown as ActivityFeedRepository;

    useCase = new GetActivityFeedUseCase(mockActivityFeedRepository);
  });

  describe("execute", () => {
    it("should return empty feed when no activities", async () => {
      const input: GetActivityFeedInput = { tripId: "trip-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activities).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
        expect(result.value.pagination.hasMore).toBe(false);
        expect(result.value.pagination.pageSize).toBe(30); // default
      }
    });

    it("should return activities for trip", async () => {
      const mockActivities = [
        createMockActivity({ id: "activity-1" as ActivityId }),
        createMockActivity({
          id: "activity-2" as ActivityId,
          title: "Another Activity",
          isPinned: true,
        }),
      ];
      mockActivityFeedRepository.findByTripId = mock(() =>
        Promise.resolve({
          activities: mockActivities,
          nextCursor: null,
          hasMore: false,
        }),
      );

      const input: GetActivityFeedInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activities).toHaveLength(2);
        expect(result.value.activities[0].id).toBe("activity-1");
        expect(result.value.activities[1].id).toBe("activity-2");
        expect(result.value.activities[1].isPinned).toBe(true);
      }
    });

    it("should use custom page size when provided", async () => {
      mockActivityFeedRepository.findByTripId = mock(() =>
        Promise.resolve({
          activities: [],
          nextCursor: null,
          hasMore: false,
        }),
      );

      const input: GetActivityFeedInput = { tripId: "trip-123", pageSize: 50 };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.pagination.pageSize).toBe(50);
      }
    });

    it("should pass cursor for pagination", async () => {
      mockActivityFeedRepository.findByTripId = mock(() =>
        Promise.resolve({
          activities: [],
          nextCursor: {
            id: "next-activity",
            createdAt: new Date("2024-01-02"),
            isPinned: false,
          },
          hasMore: true,
        }),
      );

      const cursor = {
        id: "cursor-id",
        createdAt: new Date("2024-01-01"),
        isPinned: false,
      };
      const input: GetActivityFeedInput = {
        tripId: "trip-123",
        cursor,
        pageSize: 20,
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.pagination.hasMore).toBe(true);
        expect(result.value.nextCursor).toBeDefined();
      }

      // Verify cursor was passed to repository
      const findByTripIdCall =
        mockActivityFeedRepository.findByTripId.mock.calls[0];
      expect(findByTripIdCall[1]).toMatchObject({
        cursor,
        limit: 20,
        includeHidden: false,
      });
    });

    it("should handle null cursor", async () => {
      mockActivityFeedRepository.findByTripId = mock(() =>
        Promise.resolve({
          activities: [createMockActivity()],
          nextCursor: null,
          hasMore: false,
        }),
      );

      const input: GetActivityFeedInput = {
        tripId: "trip-123",
        cursor: null,
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.nextCursor).toBeNull();
      }
    });

    it("should map activity fields correctly", async () => {
      const mockActivity = createMockActivity({
        id: "activity-123" as ActivityId,
        tripId: "trip-456",
        activityType: "challenge_event",
        title: "Challenge Started!",
        description: "A new challenge has begun",
        imageUrl: "challenge.jpg",
        isPinned: true,
        isHidden: false,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-16"),
        admin: {
          id: "admin-789",
          firstName: "Jane",
          lastName: "Smith",
        },
      });

      mockActivityFeedRepository.findByTripId = mock(() =>
        Promise.resolve({
          activities: [mockActivity],
          nextCursor: null,
          hasMore: false,
        }),
      );

      const input: GetActivityFeedInput = { tripId: "trip-456" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const activity = result.value.activities[0];
        expect(activity.id).toBe("activity-123");
        expect(activity.tripId).toBe("trip-456");
        expect(activity.activityType).toBe("challenge_event");
        expect(activity.title).toBe("Challenge Started!");
        expect(activity.description).toBe("A new challenge has begun");
        expect(activity.imageUrl).toBe("challenge.jpg");
        expect(activity.isPinned).toBe(true);
        expect(activity.isHidden).toBe(false);
        expect(activity.admin).toEqual({
          id: "admin-789",
          firstName: "Jane",
          lastName: "Smith",
        });
      }
    });

    it("should handle activities with null admin", async () => {
      const mockActivity = createMockActivity({
        admin: null,
      });

      mockActivityFeedRepository.findByTripId = mock(() =>
        Promise.resolve({
          activities: [mockActivity],
          nextCursor: null,
          hasMore: false,
        }),
      );

      const input: GetActivityFeedInput = { tripId: "trip-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.activities[0].admin).toBeNull();
      }
    });

    it("should always filter hidden activities", async () => {
      // The includeHidden: false should always be passed
      const input: GetActivityFeedInput = { tripId: "trip-123" };
      await useCase.execute(input);

      const findByTripIdCall =
        mockActivityFeedRepository.findByTripId.mock.calls[0];
      expect(findByTripIdCall[1]).toMatchObject({
        includeHidden: false,
      });
    });
  });
});
