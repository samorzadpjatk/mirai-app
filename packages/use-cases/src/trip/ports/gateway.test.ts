import { describe, it, expect } from "bun:test";
import { Effect, Context } from "effect";
import type { TripGateway } from "./gateway";
import { TripGatewayTag } from "./gateway";
import type { TripDTO } from "../dto";
import { DatabaseError, TripStatus } from "@mirai-app/domain";

describe("[UNIT] TripGatewayTag", () => {
  it("should be a valid Context.Tag", () => {
    expect(TripGatewayTag).toBeDefined();
    expect(TripGatewayTag.key).toBe("TripGateway");
  });

  it("should have correct key", () => {
    expect(TripGatewayTag.key).toBe("TripGateway");
  });
});

describe("[UNIT] TripGateway Interface Contract", () => {
  const mockTripDTO: TripDTO = {
    id: "trip-123",
    name: "Summer Vacation",
    description: "A fun summer trip",
    imageUrl: null,
    destination: "Paris",
    startDate: new Date("2024-07-01"),
    endDate: new Date("2024-07-10"),
    status: TripStatus.PLANNING,
    basePrice: null,
    totalSpots: null,
    availableSpots: null,
    registrationDeadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("create method should return Effect<TripDTO, DatabaseError>", async () => {
    const mockGateway: TripGateway = {
      create: () => Effect.succeed(mockTripDTO),
      findById: () => Effect.succeed(null),
      findAllConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findActiveConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      update: () => Effect.succeed(mockTripDTO),
      updateStatus: () => Effect.succeed(mockTripDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      countByStatus: () => Effect.succeed(0),
    };

    const result = await Effect.runPromise(mockGateway.create(mockTripDTO));
    expect(result.id).toBe("trip-123");
    expect(result.name).toBe("Summer Vacation");
  });

  it("findById should return null when trip not found", async () => {
    const mockGateway: TripGateway = {
      create: () => Effect.succeed(mockTripDTO),
      findById: () => Effect.succeed(null),
      findAllConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findActiveConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      update: () => Effect.succeed(mockTripDTO),
      updateStatus: () => Effect.succeed(mockTripDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      countByStatus: () => Effect.succeed(0),
    };

    const result = await Effect.runPromise(
      mockGateway.findById("non-existent"),
    );
    expect(result).toBeNull();
  });

  it("should handle DatabaseError from findById", async () => {
    const failingGateway: TripGateway = {
      create: () => Effect.succeed(mockTripDTO),
      findById: () =>
        Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database connection failed",
          }),
        ),
      findAllConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findActiveConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      update: () => Effect.succeed(mockTripDTO),
      updateStatus: () => Effect.succeed(mockTripDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      countByStatus: () => Effect.succeed(0),
    };

    const effect = failingGateway.findById("trip-123");
    const either = await Effect.runPromise(Effect.either(effect));

    expect(either._tag).toBe("Left");
  });

  it("countByStatus should return number", async () => {
    const mockGateway: TripGateway = {
      create: () => Effect.succeed(mockTripDTO),
      findById: () => Effect.succeed(null),
      findAllConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findActiveConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      update: () => Effect.succeed(mockTripDTO),
      updateStatus: () => Effect.succeed(mockTripDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      countByStatus: () => Effect.succeed(5),
    };

    const result = await Effect.runPromise(
      mockGateway.countByStatus("PLANNING"),
    );
    expect(result).toBe(5);
  });

  it("exists should return boolean", async () => {
    const mockGateway: TripGateway = {
      create: () => Effect.succeed(mockTripDTO),
      findById: () => Effect.succeed(null),
      findAllConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findByStatusConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      findActiveConnection: () =>
        Effect.succeed({
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }),
      update: () => Effect.succeed(mockTripDTO),
      updateStatus: () => Effect.succeed(mockTripDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(true),
      countByStatus: () => Effect.succeed(0),
    };

    const result = await Effect.runPromise(mockGateway.exists("trip-123"));
    expect(result).toBe(true);
  });
});
