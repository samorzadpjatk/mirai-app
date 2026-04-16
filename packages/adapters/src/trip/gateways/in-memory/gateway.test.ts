import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { InMemoryTripGateway } from "./gateway";
import type { TripDTO } from "@mirai-app/use-cases";
import { TripStatus } from "@mirai-app/domain";

describe("[UNIT] InMemoryTripGateway Cursor Pagination", () => {
  const createMockTrip = (
    id: string,
    createdAt: Date,
    status: TripStatus = TripStatus.ACTIVE,
  ): TripDTO => ({
    id,
    name: `Trip ${id}`,
    description: `Description for trip ${id}`,
    destination: "Test Destination",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    basePrice: 1000,
    totalSpots: 50,
    availableSpots: 50,
    registrationDeadline: new Date("2024-01-01"),
    imageUrl: null,
    status: status,
    createdAt,
    updatedAt: createdAt,
  });

  describe("findAllConnection", () => {
    it("returns empty connection when no trips exist", async () => {
      const gateway = new InMemoryTripGateway();
      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage when more items exist", async () => {
      const gateway = new InMemoryTripGateway();
      const trips = Array.from({ length: 25 }, (_, i) =>
        createMockTrip(
          `trip-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(trips));

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const gateway = new InMemoryTripGateway();
      const trips = Array.from({ length: 25 }, (_, i) =>
        createMockTrip(
          `trip-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(trips));

      // Get second page using cursor pointing to trip-010 (Jan 11)
      // Since sort is createdAt DESC, cursor points to Jan 11,
      // so we get trips 009-000 (10 items with earlier dates)
      const secondPage = await Effect.runPromise(
        gateway.findAllConnection({
          first: 10,
          after: {
            id: "trip-010",
            createdAt: new Date(2024, 0, 11).toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns hasNextPage=false on last page", async () => {
      const gateway = new InMemoryTripGateway();
      const trips = Array.from({ length: 15 }, (_, i) =>
        createMockTrip(
          `trip-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(trips));

      // Get all items
      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("findByStatusConnection", () => {
    it("filters trips by status with pagination", async () => {
      const gateway = new InMemoryTripGateway();
      const activeTrips = Array.from({ length: 15 }, (_, i) =>
        createMockTrip(
          `active-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          TripStatus.ACTIVE,
        ),
      );
      const planningTrips = Array.from({ length: 5 }, (_, i) =>
        createMockTrip(
          `planning-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 16),
          TripStatus.PLANNING,
        ),
      );
      await Effect.runPromise(gateway.seed([...activeTrips, ...planningTrips]));

      const result = await Effect.runPromise(
        gateway.findByStatusConnection(TripStatus.ACTIVE, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.nodes.every((t) => t.status === TripStatus.ACTIVE)).toBe(
        true,
      );
    });

    it("returns empty result when no trips match status", async () => {
      const gateway = new InMemoryTripGateway();
      const trips = Array.from({ length: 5 }, (_, i) =>
        createMockTrip(
          `trip-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          TripStatus.ACTIVE,
        ),
      );
      await Effect.runPromise(gateway.seed(trips));

      const result = await Effect.runPromise(
        gateway.findByStatusConnection(TripStatus.COMPLETED, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("findActiveConnection", () => {
    it("returns only currently active trips", async () => {
      const gateway = new InMemoryTripGateway();
      const now = new Date();

      // Create an active trip (encompasses current date)
      const activeTrip = createMockTrip(
        "active-001",
        new Date(2024, 0, 1),
        TripStatus.ACTIVE,
      );
      activeTrip.startDate = new Date(now.getTime() - 86400000); // yesterday
      activeTrip.endDate = new Date(now.getTime() + 86400000); // tomorrow

      // Create an inactive trip (future trip)
      const futureTrip = createMockTrip(
        "future-001",
        new Date(2024, 0, 2),
        TripStatus.ACTIVE,
      );
      futureTrip.startDate = new Date(now.getTime() + 86400000 * 2); // day after tomorrow
      futureTrip.endDate = new Date(now.getTime() + 86400000 * 3);

      await Effect.runPromise(gateway.seed([activeTrip, futureTrip]));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0]?.id).toBe("active-001");
    });
  });

  describe("cursor encoding", () => {
    it("produces valid cursors that can be used for pagination", async () => {
      const gateway = new InMemoryTripGateway();
      const trips = Array.from({ length: 30 }, (_, i) =>
        createMockTrip(
          `trip-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(trips));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      // Verify cursors exist
      const firstEdge = firstPage.edges[0];
      expect(firstEdge).toBeTruthy();
      expect(firstEdge?.cursor).toBeTruthy();
      expect(firstEdge?.cursor.length).toBeGreaterThan(0);

      // Use endCursor to fetch next page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      if (lastEdge) {
        const result = await Effect.runPromise(
          gateway.findAllConnection({
            first: 10,
            after: {
              id: lastEdge.node.id,
              createdAt: lastEdge.node.createdAt.toISOString(),
            },
          }),
        );

        expect(result.edges).toHaveLength(10);
        expect(result.pageInfo.hasPreviousPage).toBe(true);
      }
    });
  });
});
