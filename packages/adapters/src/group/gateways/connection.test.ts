import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { InMemoryGroupGateway } from "./in-memory/gateway";
import type { GroupDTO } from "@mirai-app/use-cases";
import { GroupStatus } from "@mirai-app/domain";

describe("[UNIT] InMemoryGroupGateway - Connection Methods", () => {
  const createMockGroup = (
    id: string,
    tripId: string,
    status: GroupStatus,
    createdById: string,
    createdAt: Date,
  ): GroupDTO => ({
    id,
    tripId,
    name: `Group ${id}`,
    code: `CODE${id}`,
    description: null,
    imageUrl: null,
    status,
    coins: 0,
    maxMembers: null,
    createdById,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedById: null,
  });

  describe("findByTripIdConnection", () => {
    it("returns first page with hasMore=true when more items exist", async () => {
      const gateway = new InMemoryGroupGateway();
      const tripId = "trip-123";
      const now = new Date();

      const groups = Array.from({ length: 25 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          tripId,
          GroupStatus.ACTIVE,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { limit: 10 }),
      );

      expect(result.items.length).toBe(10);
      expect(result.total).toBe(25);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });

    it("returns hasMore=false on last page", async () => {
      const gateway = new InMemoryGroupGateway();
      const tripId = "trip-123";
      const now = new Date();

      const groups = Array.from({ length: 5 }, (_, i) =>
        createMockGroup(
          `group-${i}`,
          tripId,
          GroupStatus.ACTIVE,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { limit: 10 }),
      );

      expect(result.items.length).toBe(5);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("returns empty result for trip with no groups", async () => {
      const gateway = new InMemoryGroupGateway();

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-empty", { limit: 10 }),
      );

      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("findByStatusConnection", () => {
    it("filters by status and paginates correctly", async () => {
      const gateway = new InMemoryGroupGateway();
      const now = new Date();

      const activeGroups = Array.from({ length: 15 }, (_, i) =>
        createMockGroup(
          `active-${i}`,
          "trip-1",
          GroupStatus.ACTIVE,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );

      const deletedGroups = Array.from({ length: 5 }, (_, i) =>
        createMockGroup(
          `deleted-${i}`,
          "trip-1",
          GroupStatus.DELETED,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );

      await Effect.runPromise(
        gateway.seed([...activeGroups, ...deletedGroups]),
      );

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("ACTIVE", { limit: 10 }),
      );

      expect(result.items.length).toBe(10);
      expect(result.total).toBe(15);
      expect(result.hasMore).toBe(true);
    });
  });

  describe("findByTripIdAndStatusConnection", () => {
    it("filters by both trip ID and status", async () => {
      const gateway = new InMemoryGroupGateway();
      const tripId = "trip-123";
      const now = new Date();

      const matchingGroups = Array.from({ length: 8 }, (_, i) =>
        createMockGroup(
          `match-${i}`,
          tripId,
          GroupStatus.ACTIVE,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );

      const wrongTripGroups = Array.from({ length: 3 }, (_, i) =>
        createMockGroup(
          `wrong-trip-${i}`,
          "other-trip",
          GroupStatus.ACTIVE,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );

      const wrongStatusGroups = Array.from({ length: 4 }, (_, i) =>
        createMockGroup(
          `wrong-status-${i}`,
          tripId,
          GroupStatus.DELETED,
          "organizer-1",
          new Date(now.getTime() - i * 1000),
        ),
      );

      await Effect.runPromise(
        gateway.seed([
          ...matchingGroups,
          ...wrongTripGroups,
          ...wrongStatusGroups,
        ]),
      );

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatusConnection(tripId, "ACTIVE", {
          limit: 10,
        }),
      );

      expect(result.items.length).toBe(8);
      expect(result.total).toBe(8);
    });
  });

  describe("findByOrganizerIdConnection", () => {
    it("filters by organizer ID with pagination", async () => {
      const gateway = new InMemoryGroupGateway();
      const organizerId = "organizer-abc";
      const now = new Date();

      const organizerGroups = Array.from({ length: 12 }, (_, i) =>
        createMockGroup(
          `org-group-${i}`,
          "trip-1",
          GroupStatus.ACTIVE,
          organizerId,
          new Date(now.getTime() - i * 1000),
        ),
      );

      const otherGroups = Array.from({ length: 8 }, (_, i) =>
        createMockGroup(
          `other-group-${i}`,
          "trip-1",
          GroupStatus.ACTIVE,
          "other-organizer",
          new Date(now.getTime() - i * 1000),
        ),
      );

      await Effect.runPromise(
        gateway.seed([...organizerGroups, ...otherGroups]),
      );

      const result = await Effect.runPromise(
        gateway.findByOrganizerIdConnection(organizerId, { limit: 10 }),
      );

      expect(result.items.length).toBe(10);
      expect(result.total).toBe(12);
      expect(result.hasMore).toBe(true);
    });
  });
});
