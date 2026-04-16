import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createTripUseCase,
  type CreateTripInput,
  TripCreationError,
} from "./create";
import { TripGatewayTag, type TripGateway } from "../ports/gateway";
import type { TripDTO } from "../dto";
import { DatabaseError, TripStatus } from "@mirai-app/domain";

/**
 * Mock TripGateway for testing
 */
function createMockTripGateway(
  trips: TripDTO[] = [],
  options: {
    shouldFailCreate?: boolean;
  } = {},
): TripGateway {
  const tripMap = new Map(trips.map((t) => [t.id, t]));

  return {
    create: (trip: TripDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
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

describe("[UNIT] createTripUseCase", () => {
  it("should create a trip successfully", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: CreateTripInput = {
      name: "Summer Vacation",
      description: "A fun summer trip",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-07-10"),
    };

    const program = createTripUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Summer Vacation");
    expect(result.description).toBe("A fun summer trip");
    expect(result.status).toBe("PLANNING");
    expect(result.isActive).toBe(false);
    expect(result.isPlanning).toBe(true);
    expect(result.durationInDays).toBe(9);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should use default status when not provided", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: CreateTripInput = {
      name: "Default Trip",
      startDate: new Date("2024-08-01"),
      endDate: new Date("2024-08-05"),
    };

    const program = createTripUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.status).toBe("PLANNING");
    expect(result.isPlanning).toBe(true);
  });

  it("should handle database errors during creation", async () => {
    const mockGateway = createMockTripGateway([], { shouldFailCreate: true });
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: CreateTripInput = {
      name: "Failing Trip",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2024-09-05"),
    };

    const program = createTripUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should calculate duration correctly", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: CreateTripInput = {
      name: "Week Trip",
      startDate: new Date("2024-10-01"),
      endDate: new Date("2024-10-08"),
    };

    const program = createTripUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.durationInDays).toBe(7);
  });

  it("should create trip with background image", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: CreateTripInput = {
      name: "Visual Trip",
      description: "Trip with image",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-11-05"),
      backgroundImagePath: "/images/trip-bg.jpg",
    };

    const program = createTripUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.backgroundImagePath).toBe("/images/trip-bg.jpg");
  });

  it("should fail with TripCreationError when validation fails", async () => {
    const mockGateway = createMockTripGateway([]);
    const mockLayer = Layer.succeed(TripGatewayTag, mockGateway);

    const input: CreateTripInput = {
      name: "", // Empty name should fail validation
      startDate: new Date("2024-12-01"),
      endDate: new Date("2024-12-05"),
    };

    const program = createTripUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TripCreationError);
    }
  });
});
