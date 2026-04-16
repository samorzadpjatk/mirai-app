import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteTripUseCase,
  type DeleteTripInput,
  DeleteTripNotFoundError,
} from "./delete";
import { TripGatewayTag, type TripGateway } from "../ports/gateway";
import type { TripDTO } from "../dto";
import { DatabaseError, TripStatus } from "@mirai-app/domain";

/**
 * Mock TripGateway for testing
 */
function createMockTripGateway(
  trips: TripDTO[] = [],
  options: {
    shouldFailDelete?: boolean;
  } = {},
): TripGateway {
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

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error during delete",
          }),
        );
      }
      tripMap.delete(id);
      return Effect.succeed(void 0);
    },

    exists: (id: string) => {
      return Effect.succeed(tripMap.has(id));
    },

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

describe("[UNIT] deleteTripUseCase", () => {
  it("should delete a trip successfully", async () => {
    const mockTrip = createMockTripDTO({ id: "trip-456" });
    const mockGateway = createMockTripGateway([mockTrip]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: DeleteTripInput = { tripId: "trip-456" };
    const program = deleteTripUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedTripId).toBe("trip-456");
  });

  it("should fail with DeleteTripNotFoundError when trip not found", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: DeleteTripInput = { tripId: "non-existent" };
    const program = deleteTripUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteTripNotFoundError);
      if (either.left instanceof DeleteTripNotFoundError) {
        expect(either.left.tripId).toBe("non-existent");
      }
    }
  });

  it("should handle database errors during delete", async () => {
    const mockTrip = createMockTripDTO({ id: "trip-789" });
    const mockGateway = createMockTripGateway([mockTrip], {
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: DeleteTripInput = { tripId: "trip-789" };
    const program = deleteTripUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
