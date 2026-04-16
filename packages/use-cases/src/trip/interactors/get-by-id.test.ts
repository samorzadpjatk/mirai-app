import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getTripByIdUseCase,
  type GetTripByIdInput,
  GetTripByIdNotFoundError,
} from "./get-by-id";
import { TripGatewayTag, type TripGateway } from "../ports/gateway";
import type { TripDTO } from "../dto";
import { DatabaseError, TripStatus } from "@mirai-app/domain";

/**
 * Mock TripGateway for testing
 */
function createMockTripGateway(trips: TripDTO[] = []): TripGateway {
  const tripMap = new Map(trips.map((t) => [t.id, t]));

  return {
    create: (trip: TripDTO) => {
      tripMap.set(trip.id, trip);
      return Effect.succeed(trip);
    },

    findById: (id: string) => {
      const trip = tripMap.get(id);
      return Effect.succeed(trip ?? null);
    },

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

    update: (trip: TripDTO) => Effect.succeed(trip),

    updateStatus: (id: string, status: string) => {
      const trip = tripMap.get(id);
      if (trip) {
        return Effect.succeed({ ...trip, status: status as TripStatus });
      }
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: "Trip not found",
        }),
      );
    },

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

    countByStatus: () => Effect.succeed(0),
  };
}

function createMockTripDTO(overrides: Partial<TripDTO> = {}): TripDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "trip-123",
    name: overrides.name ?? "Test Trip",
    description: overrides.description ?? null,
    imageUrl: overrides.imageUrl ?? null,
    destination: overrides.destination ?? "Test Destination",
    startDate: overrides.startDate ?? new Date("2024-06-01"),
    endDate: overrides.endDate ?? new Date("2024-06-10"),
    status: overrides.status ?? TripStatus.PLANNING,
    basePrice: overrides.basePrice ?? null,
    totalSpots: overrides.totalSpots ?? null,
    availableSpots: overrides.availableSpots ?? null,
    registrationDeadline: overrides.registrationDeadline ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("[UNIT] getTripByIdUseCase", () => {
  it("should return trip when found by ID", async () => {
    const mockTrip = createMockTripDTO({
      id: "trip-456",
      name: "Summer Adventure",
      description: "An amazing trip",
      status: TripStatus.ACTIVE,
    });
    const mockGateway = createMockTripGateway([mockTrip]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: GetTripByIdInput = { tripId: "trip-456" };
    const program = getTripByIdUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("trip-456");
    expect(result.name).toBe("Summer Adventure");
    expect(result.description).toBe("An amazing trip");
    expect(result.status).toBe("ACTIVE");
    expect(result.isActive).toBe(true);
    expect(result.isPlanning).toBe(false);
  });

  it("should fail with GetTripByIdNotFoundError when trip not found", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: GetTripByIdInput = { tripId: "non-existent" };
    const program = getTripByIdUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetTripByIdNotFoundError);
      if (either.left instanceof GetTripByIdNotFoundError) {
        expect(either.left.tripId).toBe("non-existent");
      }
    }
  });

  it("should handle database errors", async () => {
    const failingGateway: TripGateway = {
      ...createMockTripGateway([]),
      findById: () =>
        Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database connection failed",
          }),
        ),
    };
    const failingLayer = Layer.succeed(TripGatewayTag, failingGateway);

    const input: GetTripByIdInput = { tripId: "trip-123" };
    const program = getTripByIdUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return correct computed properties for planning trip", async () => {
    const mockTrip = createMockTripDTO({
      id: "trip-planning",
      status: TripStatus.PLANNING,
    });
    const mockGateway = createMockTripGateway([mockTrip]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: GetTripByIdInput = { tripId: "trip-planning" };
    const program = getTripByIdUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isPlanning).toBe(true);
    expect(result.isActive).toBe(false);
    expect(result.isCompleted).toBe(false);
    expect(result.isCancelled).toBe(false);
  });

  it("should return correct computed properties for completed trip", async () => {
    const mockTrip = createMockTripDTO({
      id: "trip-completed",
      status: TripStatus.COMPLETED,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-10"),
    });
    const mockGateway = createMockTripGateway([mockTrip]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: GetTripByIdInput = { tripId: "trip-completed" };
    const program = getTripByIdUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isCompleted).toBe(true);
    expect(result.hasEnded).toBe(true);
  });

  it("should return summary containing trip name", async () => {
    const mockTrip = createMockTripDTO({
      id: "trip-summary",
      name: "Epic Journey",
    });
    const mockGateway = createMockTripGateway([mockTrip]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: GetTripByIdInput = { tripId: "trip-summary" };
    const program = getTripByIdUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.summary).toContain("Epic Journey");
  });
});
