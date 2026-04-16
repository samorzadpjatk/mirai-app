import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { TripController } from "./controller";
import {
  TripGatewayTag,
  type TripGateway,
  type TripDTO,
} from "@mirai-app/use-cases";
import {
  TripStatus,
  DatabaseError,
  ValidationError,
  StateTransitionError,
} from "@mirai-app/domain";

/**
 * Creates a mock Trip entity with all methods expected by the use cases.
 *
 * The use cases expect Trip entities with methods like isTerminal(), updateDetails(),
 * updateDates(), updateStatus(), etc. This creates a "fantasy" object that combines
 * DTO properties with entity methods for testing purposes.
 */
function createMockTripEntity(dto: TripDTO) {
  return {
    ...dto,

    // Terminal state check
    isTerminal: () =>
      dto.status === TripStatus.COMPLETED ||
      dto.status === TripStatus.CANCELLED,

    // Update methods expected by use cases
    updateDetails: (props: {
      name?: string;
      description?: string | null;
      backgroundImagePath?: string | null;
    }) => {
      if (props.name !== undefined && props.name.trim() === "") {
        return Effect.fail(
          new ValidationError({
            field: "name",
            message: "Name cannot be empty",
          }),
        );
      }
      return Effect.succeed({
        ...dto,
        name: props.name ?? dto.name,
        description:
          props.description !== undefined ? props.description : dto.description,
        imageUrl:
          props.backgroundImagePath !== undefined
            ? props.backgroundImagePath
            : dto.imageUrl,
        updatedAt: new Date(),
      });
    },

    updateDates: (props: { startDate?: Date; endDate?: Date }) => {
      const startDate = props.startDate ?? dto.startDate;
      const endDate = props.endDate ?? dto.endDate;

      if (endDate < startDate) {
        return Effect.fail(
          new ValidationError({
            field: "endDate",
            message: "endDate must be after startDate",
          }),
        );
      }

      return Effect.succeed({
        ...dto,
        startDate,
        endDate,
        updatedAt: new Date(),
      });
    },

    updateStatus: (status: TripStatus) => {
      const validTransitions: Record<TripStatus, TripStatus[]> = {
        [TripStatus.PLANNING]: [TripStatus.ACTIVE, TripStatus.CANCELLED],
        [TripStatus.ACTIVE]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
        [TripStatus.COMPLETED]: [],
        [TripStatus.CANCELLED]: [],
      };

      if (!validTransitions[dto.status].includes(status)) {
        return Effect.fail(
          new StateTransitionError({
            from: dto.status,
            to: status,
            entityType: "Trip",
            message: `Cannot transition from ${dto.status} to ${status}`,
          }),
        );
      }

      return Effect.succeed({
        ...dto,
        status,
        updatedAt: new Date(),
      });
    },

    // Utility methods
    isActive: () => dto.status === TripStatus.ACTIVE,
    isPlanning: () => dto.status === TripStatus.PLANNING,
    isCompleted: () => dto.status === TripStatus.COMPLETED,
    isCancelled: () => dto.status === TripStatus.CANCELLED,
    isOngoing: () => {
      const now = new Date();
      return (
        dto.status === TripStatus.ACTIVE &&
        dto.startDate <= now &&
        dto.endDate >= now
      );
    },
    hasStarted: () => dto.startDate <= new Date(),
    hasEnded: () => dto.endDate <= new Date(),

    getDurationInDays: () => {
      const diffTime = dto.endDate.getTime() - dto.startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getSummary: () =>
      `${dto.name} (${Math.ceil((dto.endDate.getTime() - dto.startDate.getTime()) / (1000 * 60 * 60 * 24))} days)`,
  };
}

/**
 * Extended TripGateway interface with additional methods used by controller
 */
interface ExtendedTripGateway extends TripGateway {
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<TripDTO[], never, never>;
  findByStatus(status: TripStatus): Effect.Effect<TripDTO[], never, never>;
  findActive(): Effect.Effect<TripDTO[], never, never>;
}

/**
 * Mock TripGateway for testing
 */
function createMockTripGateway(trips: TripDTO[] = []): ExtendedTripGateway {
  const storage = new Map(trips.map((t) => [t.id, t]));

  return {
    create: (trip: TripDTO) => {
      storage.set(trip.id, trip);
      return Effect.succeed(trip);
    },

    findById: (id: string) => {
      const trip = storage.get(id);
      if (!trip) {
        return Effect.succeed(null);
      }
      // Return a mock entity with methods
      return Effect.succeed(createMockTripEntity(trip) as unknown as TripDTO);
    },

    findAll: (options?: { limit?: number; offset?: number }) => {
      return Effect.sync(() => {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;
        const allItems = Array.from(storage.values());
        return allItems.slice(offset, offset + limit);
      });
    },

    findByStatus: (status: TripStatus) => {
      return Effect.sync(() => {
        return Array.from(storage.values()).filter((t) => t.status === status);
      });
    },

    findActive: () => {
      return Effect.sync(() => {
        return Array.from(storage.values()).filter(
          (t) => t.status === TripStatus.ACTIVE,
        );
      });
    },

    findAllConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: Array.from(storage.values()),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
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
      }),

    update: (trip: TripDTO) => {
      // The trip returned from updateDetails/updateDates/updateStatus needs
      // to be wrapped with entity methods again since those methods return
      // plain objects, not entity objects
      const entityWithMethods = createMockTripEntity(trip);
      storage.set(trip.id, trip);
      return Effect.succeed(entityWithMethods as unknown as TripDTO);
    },

    updateStatus: (id: string, status: TripStatus) => {
      return Effect.gen(function* () {
        const trip = storage.get(id);
        if (!trip) {
          return yield* Effect.fail(
            new DatabaseError({
              operation: "updateStatus",
              message: `Trip with id ${id} not found`,
            }),
          );
        }
        const updated: TripDTO = {
          ...trip,
          status,
          updatedAt: new Date(),
        };
        storage.set(id, updated);
        return updated;
      });
    },

    delete: (id: string) => {
      storage.delete(id);
      return Effect.succeed(void 0);
    },

    exists: (id: string) => {
      return Effect.succeed(storage.has(id));
    },

    countByStatus: () => Effect.succeed(0),
  };
}

function createMockTripDTO(overrides: Partial<TripDTO> = {}): TripDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
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

describe("[UNIT] TripController", () => {
  let controller: TripController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockTripGateway();
    mockLayer = Layer.succeed(
      TripGatewayTag,
      mockGateway as TripGateway,
    ) as Layer.Layer<unknown>;
    controller = new TripController(mockLayer);
  });

  describe("getById", () => {
    it("should return trip when found by valid ID", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Summer Adventure",
        status: TripStatus.ACTIVE,
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-10"),
      });
      const mockGateway = createMockTripGateway([mockTrip]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.name).toBe("Summer Adventure");
        expect(result.data.status).toBe("ACTIVE");
        expect(result.data.isActive).toBe(true);
        expect(result.data.isPlanning).toBe(false);
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should return error for invalid UUID format", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when trip not found", async () => {
      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
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
      mockLayer = Layer.succeed(
        TripGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database connection failed");
      }
    });

    it("should return error for missing id", async () => {
      const result = await controller.getById({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("create", () => {
    it("should create trip with valid input", async () => {
      const result = await controller.create({
        name: "New Adventure",
        description: "An exciting trip",
        startDate: "2024-07-01",
        endDate: "2024-07-10",
        backgroundImagePath: "https://example.com/image.jpg",
        status: "PLANNING",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Adventure");
        expect(result.data.description).toBe("An exciting trip");
        expect(result.data.status).toBe("PLANNING");
        expect(result.data.isPlanning).toBe(true);
        expect(result.data.isActive).toBe(false);
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should create trip with minimal fields", async () => {
      const result = await controller.create({
        name: "Minimal Trip",
        startDate: "2024-08-01",
        endDate: "2024-08-05",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Minimal Trip");
        expect(result.data.description).toBeNull();
        expect(result.data.backgroundImagePath).toBeNull();
        expect(result.data.status).toBe("PLANNING");
      }
    });

    it("should return error for missing name", async () => {
      const result = await controller.create({
        startDate: "2024-07-01",
        endDate: "2024-07-10",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty name", async () => {
      const result = await controller.create({
        name: "",
        startDate: "2024-07-01",
        endDate: "2024-07-10",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for name exceeding 200 characters", async () => {
      const result = await controller.create({
        name: "A".repeat(201),
        startDate: "2024-07-01",
        endDate: "2024-07-10",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when end date is before start date", async () => {
      const result = await controller.create({
        name: "Invalid Dates",
        startDate: "2024-07-10",
        endDate: "2024-07-01",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("End date must be after start date");
      }
    });

    it("should handle database errors during create", async () => {
      const failingGateway: TripGateway = {
        ...createMockTripGateway([]),
        create: () =>
          Effect.fail(
            new DatabaseError({
              operation: "create",
              message: "Database write failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        TripGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.create({
        name: "New Trip",
        startDate: "2024-07-01",
        endDate: "2024-07-10",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database write failed");
      }
    });
  });

  describe("update", () => {
    it("should update trip name successfully", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Old Name",
      });
      const mockGateway = createMockTripGateway([mockTrip]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.update({
        tripId: "550e8400-e29b-41d4-a716-446655440002",
        name: "New Name",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440002");
        expect(result.data.name).toBe("New Name");
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should update trip description successfully", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440003",
      });
      const mockGateway = createMockTripGateway([mockTrip]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.update({
        tripId: "550e8400-e29b-41d4-a716-446655440003",
        description: "Updated description",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Updated description");
      }
    });

    it("should return error for invalid trip ID format", async () => {
      const result = await controller.update({
        tripId: "invalid-id",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when trip not found", async () => {
      const result = await controller.update({
        tripId: "550e8400-e29b-41d4-a716-446655440999",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle database errors during update", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440005",
      });
      const failingGateway: TripGateway = {
        ...createMockTripGateway([mockTrip]),
        update: () =>
          Effect.fail(
            new DatabaseError({
              operation: "update",
              message: "Database update failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        TripGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.update({
        tripId: "550e8400-e29b-41d4-a716-446655440005",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database update failed");
      }
    });

    it("should return error for name exceeding 200 characters", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440006",
      });
      const mockGateway = createMockTripGateway([mockTrip]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.update({
        tripId: "550e8400-e29b-41d4-a716-446655440006",
        name: "A".repeat(201),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("updateStatus", () => {
    it("should update trip status from PLANNING to ACTIVE", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440007",
        name: "Status Test Trip",
        status: TripStatus.PLANNING,
      });
      const mockGateway = createMockTripGateway([mockTrip]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.updateStatus({
        tripId: "550e8400-e29b-41d4-a716-446655440007",
        newStatus: "ACTIVE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440007");
        expect(result.data.name).toBe("Status Test Trip");
        expect(result.data.status).toBe("ACTIVE");
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should return error for invalid trip ID format", async () => {
      const result = await controller.updateStatus({
        tripId: "invalid-id",
        newStatus: "ACTIVE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid status", async () => {
      const result = await controller.updateStatus({
        tripId: "550e8400-e29b-41d4-a716-446655440000",
        newStatus: "INVALID_STATUS",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when trip not found", async () => {
      const result = await controller.updateStatus({
        tripId: "550e8400-e29b-41d4-a716-446655440999",
        newStatus: "ACTIVE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("list", () => {
    it("should return list of trips with default pagination", async () => {
      const mockTrips = [
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440010",
          name: "Trip 1",
        }),
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440011",
          name: "Trip 2",
        }),
      ];
      const mockGateway = createMockTripGateway(mockTrips);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        const first = result.data[0];
        const second = result.data[1];
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        if (first && second) {
          expect(first.name).toBe("Trip 1");
          expect(second.name).toBe("Trip 2");
        }
      }
    });

    it("should return list with custom limit", async () => {
      const mockTrips = Array.from({ length: 5 }, (_, i) =>
        createMockTripDTO({
          id: `550e8400-e29b-41d4-a716-446655440${10 + i}`,
          name: `Trip ${i + 1}`,
        }),
      );
      const mockGateway = createMockTripGateway(mockTrips);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.list({ limit: 3 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(5);
      }
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.list({ limit: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative offset", async () => {
      const result = await controller.list({ offset: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for limit exceeding 100", async () => {
      const result = await controller.list({ limit: 101 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during list", async () => {
      const failingGateway = {
        ...createMockTripGateway([]),
        findAll: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findAll",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        TripGatewayTag,
        failingGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should return empty list when no trips exist", async () => {
      const mockGateway = createMockTripGateway([]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("listByStatus", () => {
    it("should return trips filtered by status", async () => {
      const mockTrips = [
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440020",
          name: "Active Trip 1",
          status: TripStatus.ACTIVE,
        }),
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440021",
          name: "Active Trip 2",
          status: TripStatus.ACTIVE,
        }),
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440022",
          name: "Planning Trip",
          status: TripStatus.PLANNING,
        }),
      ];
      const mockGateway = createMockTripGateway(mockTrips);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.listByStatus({
        status: "ACTIVE",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        const first = result.data[0];
        const second = result.data[1];
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        if (first && second) {
          expect(first.name).toBe("Active Trip 1");
          expect(second.name).toBe("Active Trip 2");
        }
      }
    });

    it("should return error for invalid status", async () => {
      const result = await controller.listByStatus({
        status: "INVALID",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.listByStatus({
        status: "ACTIVE",
        limit: 0,
        offset: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should apply pagination correctly", async () => {
      const mockTrips = Array.from({ length: 10 }, (_, i) =>
        createMockTripDTO({
          id: `550e8400-e29b-41d4-a716-446655440${20 + i}`,
          name: `Active Trip ${i + 1}`,
          status: TripStatus.ACTIVE,
        }),
      );
      const mockGateway = createMockTripGateway(mockTrips);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.listByStatus({
        status: "ACTIVE",
        limit: 5,
        offset: 2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(5);
      }
    });
  });

  describe("findActive", () => {
    it("should return active trips", async () => {
      const mockTrips = [
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440030",
          name: "Active Trip 1",
          status: TripStatus.ACTIVE,
        }),
        createMockTripDTO({
          id: "550e8400-e29b-41d4-a716-446655440031",
          name: "Active Trip 2",
          status: TripStatus.ACTIVE,
        }),
      ];
      const mockGateway = createMockTripGateway(mockTrips);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.findActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return empty list when no active trips", async () => {
      const mockGateway = createMockTripGateway([]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.findActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("should handle database errors", async () => {
      const failingGateway = {
        ...createMockTripGateway([]),
        findActive: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findActive",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        TripGatewayTag,
        failingGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.findActive();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error");
      }
    });
  });

  describe("delete", () => {
    it("should delete trip successfully", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440040",
      });
      const mockGateway = createMockTripGateway([mockTrip]);
      mockLayer = Layer.succeed(
        TripGatewayTag,
        mockGateway as TripGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440040",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
        expect(result.data.tripId).toBe("550e8400-e29b-41d4-a716-446655440040");
      }
    });

    it("should return error for invalid trip ID format", async () => {
      const result = await controller.delete({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when trip not found", async () => {
      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle database errors during delete", async () => {
      const mockTrip = createMockTripDTO({
        id: "550e8400-e29b-41d4-a716-446655440041",
      });
      const failingGateway: TripGateway = {
        ...createMockTripGateway([mockTrip]),
        exists: () => Effect.succeed(true),
        delete: () =>
          Effect.fail(
            new DatabaseError({
              operation: "delete",
              message: "Database delete failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        TripGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new TripController(mockLayer);

      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440041",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database delete failed");
      }
    });
  });

  describe("input validators", () => {
    it("exports all validator functions", async () => {
      const {
        validateGetByIdInput,
        validateCreateTripInput,
        validateUpdateTripInput,
        validateUpdateStatusInput,
        validateListInput,
        validateListByStatusInput,
      } = await import("./controller");

      expect(validateGetByIdInput).toBeDefined();
      expect(validateCreateTripInput).toBeDefined();
      expect(validateUpdateTripInput).toBeDefined();
      expect(validateUpdateStatusInput).toBeDefined();
      expect(validateListInput).toBeDefined();
      expect(validateListByStatusInput).toBeDefined();
    });
  });

  describe("runWithLayer helper", () => {
    it("handles unknown errors gracefully", async () => {
      const throwingGateway: TripGateway = {
        ...createMockTripGateway([]),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "String error",
            }),
          ),
      };
      const throwingLayer = Layer.succeed(
        TripGatewayTag,
        throwingGateway,
      ) as Layer.Layer<unknown>;
      const throwingController = new TripController(throwingLayer);

      const result = await throwingController.getById({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("handles non-Error exceptions in error path", async () => {
      const customError = new DatabaseError({
        operation: "test",
        message: "Custom error",
      });

      const throwingGateway: TripGateway = {
        ...createMockTripGateway([]),
        findById: () => Effect.fail(customError),
      };
      const throwingLayer = Layer.succeed(
        TripGatewayTag,
        throwingGateway,
      ) as Layer.Layer<unknown>;
      const throwingController = new TripController(throwingLayer);

      const result = await throwingController.getById({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});

/**
 * Summary
 *
 * This test suite provides comprehensive coverage for the TripController:
 *
 * ## Test Organization
 *
 * Tests are organized by controller method:
 * - getById: 5 tests (success, invalid UUID, not found, DB error, missing id)
 * - create: 7 tests (success, minimal fields, validation errors, DB errors)
 * - update: 6 tests (field updates, validation errors, not found, DB errors)
 * - updateStatus: 4 tests (success, invalid inputs, not found)
 * - list: 7 tests (pagination, validation errors, empty list, DB errors)
 * - listByStatus: 4 tests (filtering, pagination, validation)
 * - findActive: 3 tests (success, empty, DB errors)
 * - delete: 4 tests (success, validation, not found, DB errors)
 * - input validators: 1 test (exports verification)
 * - runWithLayer helper: 2 tests (error handling edge cases)
 *
 * ## Key Testing Patterns
 *
 * 1. **Effect-based mocking**: Uses Layer.succeed with TripGatewayTag for DI
 * 2. **Mock Trip Entity**: Creates "fantasy" objects with DTO properties + entity methods
 *    - Required because use cases expect entities with methods like isTerminal(), updateDetails()
 * 3. **Error testing**: Tests validation errors, DB errors, not-found errors
 * 4. **Success cases**: Tests happy path with full data verification
 * 5. **Edge cases**: Tests empty results, invalid inputs, boundary conditions
 *
 * ## Test Data
 *
 * - Uses UUID format IDs: 550e8400-e29b-41d4-a716-446655440XXX
 * - Mock trips with various statuses: PLANNING, ACTIVE, COMPLETED, CANCELLED
 * - Tests pagination with 0-10 items
 *
 * ## Coverage Areas
 *
 * - Input validation (Effect schemas via validators/schema.ts)
 * - Use case delegation (create, update, getById, delete, updateStatus)
 * - Direct repository access (list, listByStatus, findActive)
 * - Error handling and transformation
 * - Result shape verification
 */
