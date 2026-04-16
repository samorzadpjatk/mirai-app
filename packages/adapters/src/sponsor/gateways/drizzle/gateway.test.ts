import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleSponsorGateway } from "./gateway";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type {
  SponsorDTO,
  TripSponsorDTO,
  SponsorConnectionArgs,
} from "@mirai-app/use-cases";
import { DatabaseError } from "../../../system/shared/gateways/in-memory-base";
import type {
  SponsorSelect,
  TripSponsorSelect,
} from "@mirai-app/frameworks/drizzle/schema";
import { SponsorId } from "@mirai-app/domain";

/**
 * Unit tests for DrizzleSponsorGateway
 *
 * Tests the gateway methods for sponsor management:
 * - findById() - Find sponsor by ID
 * - findAll() - Find all sponsors with offset/limit pagination
 * - create() - Create a new sponsor
 * - update() - Update an existing sponsor
 * - delete() - Delete a sponsor
 * - exists() - Check if sponsor exists
 * - findByTripId() - Find sponsors linked to a trip
 * - linkToTrip() - Link sponsor to a trip
 * - unlinkFromTrip() - Unlink sponsor from a trip
 * - findActiveConnection() - Cursor-based pagination for active sponsors
 * - findByTripIdConnection() - Cursor-based pagination for trip sponsors
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Branded ID Helper
// ============================================================================

/**
 * Create a SponsorId from a string (unsafe for tests only)
 */
function createSponsorId(
  id: string,
): ReturnType<typeof SponsorId.unsafeCreate> {
  return SponsorId.unsafeCreate(id);
}

// ============================================================================
// Mock Data Helpers
// ============================================================================

/**
 * Create a mock SponsorSelect record
 */
function createMockSponsorRecord(
  overrides: Partial<SponsorSelect> = {},
): SponsorSelect {
  const now = new Date();
  return {
    id: overrides.id ?? "sponsor-123",
    name: overrides.name ?? "Test Sponsor",
    description: overrides.description ?? "A test sponsor description",
    logoPath: overrides.logoPath ?? "https://example.com/logo.png",
    height: overrides.height ?? null,
    offsetX: overrides.offsetX ?? null,
    offsetY: overrides.offsetY ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Create a mock TripSponsorSelect record
 */
function createMockTripSponsorRecord(
  overrides: Partial<TripSponsorSelect> = {},
): TripSponsorSelect {
  const now = new Date();
  return {
    id: overrides.id ?? "trip-sponsor-123",
    tripId: overrides.tripId ?? "trip-456",
    sponsorId: overrides.sponsorId ?? "sponsor-123",
    createdAt: overrides.createdAt ?? now,
  };
}

/**
 * Create a SponsorDTO from a mock record
 */
function createMockSponsorDTO(record: SponsorSelect): SponsorDTO {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    logoUrl: record.logoPath,
    websiteUrl: null,
    contactEmail: null,
    contactPhone: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// ============================================================================
// Mock Drizzle Db Factories
// ============================================================================

/**
 * Create a mock DrizzleDb for findById queries
 */
function createFindByIdMockDb(record: SponsorSelect | null): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(record ? [record] : []),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for findAll queries
 */
function createFindAllMockDb(
  records: SponsorSelect[],
  totalCount: number,
): DrizzleDb {
  let selectCallCount = 0;

  return {
    select: (columns?: Record<string, unknown>) => {
      selectCallCount++;
      const isCountQuery = selectCallCount === 1;

      // First call is count query
      if (isCountQuery) {
        return {
          from: () => Promise.resolve([{ count: totalCount }]),
        };
      }

      // Second call is data query
      // Create a query builder that supports chaining and is awaitable
      const createQueryBuilder = (finalRecords: SponsorSelect[]): unknown => {
        const queryPromise = Promise.resolve(finalRecords);

        const builder = {
          limit: () => {
            // Return new builder with limit applied
            return {
              offset: () => queryPromise,
            };
          },
          offset: () => queryPromise,
          // Make builder awaitable
          then: (onFulfilled: (value: SponsorSelect[]) => unknown) =>
            queryPromise.then(onFulfilled),
        };

        return builder;
      };

      return {
        from: () => ({
          orderBy: () => createQueryBuilder(records),
        }),
      };
    },
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for create operation
 */
function createCreateMockDb(record: SponsorSelect): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([record]),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for update operation
 */
function createUpdateMockDb(record: SponsorSelect): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([record]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for delete operation
 */
function createDeleteMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(undefined),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for exists queries
 */
function createExistsMockDb(exists: boolean): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(exists ? [{ id: "sponsor-123" }] : []),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for findByTripId queries
 */
function createFindByTripIdMockDb(
  tripSponsorRecords: TripSponsorSelect[],
  sponsorRecords: SponsorSelect[],
): DrizzleDb {
  let selectCallCount = 0;

  return {
    select: () => {
      selectCallCount++;
      const isSecondQuery = selectCallCount === 2;

      return {
        from: () => ({
          where: () => {
            if (isSecondQuery) {
              // Second query - sponsors with IN clause
              return {
                orderBy: () => Promise.resolve(sponsorRecords),
              };
            }
            // First query - trip sponsors
            return Promise.resolve(tripSponsorRecords);
          },
        }),
      };
    },
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for linkToTrip operation (new record)
 */
function createLinkToTripNewMockDb(record: TripSponsorSelect): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve([record]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for linkToTrip operation (existing record - conflict)
 */
function createLinkToTripExistingMockDb(record: TripSponsorSelect): DrizzleDb {
  let callCount = 0;

  return {
    insert: () => {
      callCount++;
      return {
        values: () => ({
          onConflictDoNothing: () => ({
            returning: () => Promise.resolve([]), // Empty = conflict
          }),
        }),
      };
    },
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([record]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for unlinkFromTrip operation
 */
function createUnlinkFromTripMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(undefined),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for findActiveConnection queries
 */
function createFindActiveConnectionMockDb(
  records: SponsorSelect[],
  hasMore: boolean,
): DrizzleDb {
  const allRecords = hasMore
    ? [...records, createMockSponsorRecord({ id: "extra" })]
    : records;

  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(allRecords),
          }),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for findByTripIdConnection queries
 */
function createFindByTripIdConnectionMockDb(
  tripSponsorRecords: TripSponsorSelect[],
  sponsorRecords: SponsorSelect[],
  hasMore: boolean,
): DrizzleDb {
  const allTripSponsors = hasMore
    ? [...tripSponsorRecords, createMockTripSponsorRecord({ id: "extra" })]
    : tripSponsorRecords;

  let callCount = 0;

  return {
    select: () => {
      callCount++;
      const isSecondQuery = callCount === 2;

      return {
        from: () => {
          if (isSecondQuery) {
            // Second query - sponsors with IN clause
            // Chain: .select().from().where(and(...))
            return {
              where: () => Promise.resolve(sponsorRecords),
            };
          }
          // First query - trip sponsors with pagination
          // Chain: .select().from().where().orderBy().limit()
          return {
            where: () => ({
              orderBy: () => ({
                limit: () => Promise.resolve(allTripSponsors),
              }),
            }),
          };
        },
      };
    },
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb that always fails
 */
function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error(errorMessage)),
          orderBy: () => ({
            limit: () => Promise.reject(new Error(errorMessage)),
          }),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.reject(new Error(errorMessage)),
        onConflictDoNothing: () => ({
          returning: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
    delete: () => ({
      where: () => Promise.reject(new Error(errorMessage)),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleSponsorGateway", () => {
  // ==========================================================================
  // findById() Method Tests
  // ==========================================================================

  describe("findById()", () => {
    it("returns sponsor DTO when found", async () => {
      const mockRecord = createMockSponsorRecord({ id: "sponsor-123" });
      const mockDb = createFindByIdMockDb(mockRecord);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findById(createSponsorId("sponsor-123")),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("sponsor-123");
      expect(result?.name).toBe("Test Sponsor");
    });

    it("returns null when sponsor not found", async () => {
      const mockDb = createFindByIdMockDb(null);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findById(createSponsorId("nonexistent")),
      );

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findById(createSponsorId("sponsor-123"))),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findById");
      }
    });
  });

  // ==========================================================================
  // findAll() Method Tests
  // ==========================================================================

  describe("findAll()", () => {
    it("returns all sponsors with default pagination", async () => {
      const records = [
        createMockSponsorRecord({ id: "sponsor-1" }),
        createMockSponsorRecord({ id: "sponsor-2" }),
        createMockSponsorRecord({ id: "sponsor-3" }),
      ];
      const mockDb = createFindAllMockDb(records, 3);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll());

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.offset).toBe(0);
    });

    it("returns paginated results with limit and offset", async () => {
      const records = [createMockSponsorRecord({ id: "sponsor-2" })];
      const mockDb = createFindAllMockDb(records, 10);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findAll({ limit: 1, offset: 1 }),
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(1);
    });

    it("returns empty result when no sponsors exist", async () => {
      const mockDb = createFindAllMockDb([], 0);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll());

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(Effect.either(gateway.findAll()));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findAll");
      }
    });
  });

  // ==========================================================================
  // create() Method Tests
  // ==========================================================================

  describe("create()", () => {
    it("creates and returns sponsor DTO", async () => {
      const createdRecord = createMockSponsorRecord({
        id: "new-sponsor",
        name: "New Sponsor",
      });
      const mockDb = createCreateMockDb(createdRecord);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const sponsorDTO: SponsorDTO = {
        id: "new-sponsor",
        name: "New Sponsor",
        description: "Description",
        logoUrl: "https://example.com/logo.png",
        websiteUrl: null,
        contactEmail: null,
        contactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await Effect.runPromise(gateway.create(sponsorDTO));

      expect(result.id).toBe("new-sponsor");
      expect(result.name).toBe("New Sponsor");
    });

    it("returns DatabaseError when insert fails", async () => {
      const mockDb = createFailingMockDb("Insert failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const sponsorDTO: SponsorDTO = {
        id: "new-sponsor",
        name: "New Sponsor",
        description: "Description",
        logoUrl: "https://example.com/logo.png",
        websiteUrl: null,
        contactEmail: null,
        contactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const either = await Effect.runPromise(
        Effect.either(gateway.create(sponsorDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("create");
      }
    });

    it("returns DatabaseError when no record returned", async () => {
      const mockDb = {
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([]),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleSponsorGateway(mockDb);

      const sponsorDTO: SponsorDTO = {
        id: "new-sponsor",
        name: "New Sponsor",
        description: "Description",
        logoUrl: "https://example.com/logo.png",
        websiteUrl: null,
        contactEmail: null,
        contactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const either = await Effect.runPromise(
        Effect.either(gateway.create(sponsorDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // update() Method Tests
  // ==========================================================================

  describe("update()", () => {
    it("updates and returns sponsor DTO", async () => {
      const updatedRecord = createMockSponsorRecord({
        id: "sponsor-123",
        name: "Updated Sponsor",
        description: "Updated description",
      });
      const mockDb = createUpdateMockDb(updatedRecord);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const sponsorDTO: SponsorDTO = {
        id: "sponsor-123",
        name: "Updated Sponsor",
        description: "Updated description",
        logoUrl: "https://example.com/logo.png",
        websiteUrl: null,
        contactEmail: null,
        contactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await Effect.runPromise(gateway.update(sponsorDTO));

      expect(result.id).toBe("sponsor-123");
      expect(result.name).toBe("Updated Sponsor");
    });

    it("returns DatabaseError when update fails", async () => {
      const mockDb = createFailingMockDb("Update failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const sponsorDTO: SponsorDTO = {
        id: "sponsor-123",
        name: "Updated Sponsor",
        description: "Description",
        logoUrl: "https://example.com/logo.png",
        websiteUrl: null,
        contactEmail: null,
        contactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const either = await Effect.runPromise(
        Effect.either(gateway.update(sponsorDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("update");
      }
    });

    it("returns DatabaseError when sponsor not found", async () => {
      const mockDb = {
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([]),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleSponsorGateway(mockDb);

      const sponsorDTO: SponsorDTO = {
        id: "nonexistent",
        name: "Updated Sponsor",
        description: "Description",
        logoUrl: "https://example.com/logo.png",
        websiteUrl: null,
        contactEmail: null,
        contactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const either = await Effect.runPromise(
        Effect.either(gateway.update(sponsorDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // delete() Method Tests
  // ==========================================================================

  describe("delete()", () => {
    it("deletes sponsor successfully", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.delete(createSponsorId("sponsor-123")),
      );

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Delete failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.delete(createSponsorId("sponsor-123"))),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("delete");
      }
    });
  });

  // ==========================================================================
  // exists() Method Tests
  // ==========================================================================

  describe("exists()", () => {
    it("returns true when sponsor exists", async () => {
      const mockDb = createExistsMockDb(true);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.exists(createSponsorId("sponsor-123")),
      );

      expect(result).toBe(true);
    });

    it("returns false when sponsor does not exist", async () => {
      const mockDb = createExistsMockDb(false);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.exists(createSponsorId("nonexistent")),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.exists(createSponsorId("sponsor-123"))),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("exists");
      }
    });
  });

  // ==========================================================================
  // findByTripId() Method Tests
  // ==========================================================================

  describe("findByTripId()", () => {
    it("returns trip sponsors with sponsor data", async () => {
      const tripSponsorRecords = [
        createMockTripSponsorRecord({
          id: "ts-1",
          tripId: "trip-123",
          sponsorId: "sponsor-1",
        }),
        createMockTripSponsorRecord({
          id: "ts-2",
          tripId: "trip-123",
          sponsorId: "sponsor-2",
        }),
      ];
      const sponsorRecords = [
        createMockSponsorRecord({ id: "sponsor-1", name: "Sponsor One" }),
        createMockSponsorRecord({ id: "sponsor-2", name: "Sponsor Two" }),
      ];

      const mockDb = createFindByTripIdMockDb(
        tripSponsorRecords,
        sponsorRecords,
      );
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-123"));

      expect(result).toHaveLength(2);
      expect(result[0]?.sponsor?.name).toBe("Sponsor One");
      expect(result[1]?.sponsor?.name).toBe("Sponsor Two");
    });

    it("returns empty array when no trip sponsors found", async () => {
      const mockDb = createFindByTripIdMockDb([], []);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-empty"),
      );

      expect(result).toHaveLength(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripId("trip-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripId");
      }
    });
  });

  // ==========================================================================
  // linkToTrip() Method Tests
  // ==========================================================================

  describe("linkToTrip()", () => {
    it("creates new trip sponsor link", async () => {
      const tripSponsorRecord = createMockTripSponsorRecord({
        id: "new-ts",
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });
      const mockDb = createLinkToTripNewMockDb(tripSponsorRecord);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.linkToTrip("trip-123", createSponsorId("sponsor-456"), "gold"),
      );

      expect(result.id).toBe("new-ts");
      expect(result.tripId).toBe("trip-123");
      expect(result.sponsorId).toBe("sponsor-456");
      expect(result.tier).toBe("gold");
    });

    it("returns existing trip sponsor on conflict", async () => {
      const existingRecord = createMockTripSponsorRecord({
        id: "existing-ts",
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });
      const mockDb = createLinkToTripExistingMockDb(existingRecord);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.linkToTrip(
          "trip-123",
          createSponsorId("sponsor-456"),
          "silver",
        ),
      );

      expect(result.id).toBe("existing-ts");
      expect(result.tier).toBe("silver");
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.linkToTrip(
            "trip-123",
            createSponsorId("sponsor-456"),
            "gold",
          ),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("linkToTrip");
      }
    });
  });

  // ==========================================================================
  // unlinkFromTrip() Method Tests
  // ==========================================================================

  describe("unlinkFromTrip()", () => {
    it("unlinks sponsor from trip successfully", async () => {
      const mockDb = createUnlinkFromTripMockDb();
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.unlinkFromTrip("trip-123", createSponsorId("sponsor-456")),
      );

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Delete failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.unlinkFromTrip("trip-123", createSponsorId("sponsor-456")),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("unlinkFromTrip");
      }
    });
  });

  // ==========================================================================
  // findActiveConnection() Method Tests (Cursor-based Pagination)
  // ==========================================================================

  describe("findActiveConnection()", () => {
    it("returns connection with default pagination", async () => {
      const records = [
        createMockSponsorRecord({ id: "sponsor-1" }),
        createMockSponsorRecord({ id: "sponsor-2" }),
      ];
      const mockDb = createFindActiveConnectionMockDb(records, false);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(gateway.findActiveConnection({}));

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns connection with hasNextPage when more results exist", async () => {
      const records = [
        createMockSponsorRecord({ id: "sponsor-1" }),
        createMockSponsorRecord({ id: "sponsor-2" }),
      ];
      const mockDb = createFindActiveConnectionMockDb(records, true);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 2 }),
      );

      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns connection with hasPreviousPage when cursor provided", async () => {
      const records = [createMockSponsorRecord({ id: "sponsor-2" })];
      const mockDb = createFindActiveConnectionMockDb(records, false);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const args: SponsorConnectionArgs = {
        first: 1,
        after: { id: "sponsor-1", createdAt: new Date().toISOString() },
      };

      const result = await Effect.runPromise(
        gateway.findActiveConnection(args),
      );

      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns empty connection when no sponsors exist", async () => {
      const mockDb = createFindActiveConnectionMockDb([], false);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(gateway.findActiveConnection({}));

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns edges with cursors", async () => {
      const records = [createMockSponsorRecord({ id: "sponsor-1" })];
      const mockDb = createFindActiveConnectionMockDb(records, false);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(gateway.findActiveConnection({}));

      expect(result.edges[0]?.cursor).toBeDefined();
      expect(result.edges[0]?.node.id).toBe("sponsor-1");
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findActiveConnection({})),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findActiveConnection");
      }
    });
  });

  // ==========================================================================
  // findByTripIdConnection() Method Tests (Cursor-based Pagination)
  // ==========================================================================

  describe("findByTripIdConnection()", () => {
    it("returns connection with trip sponsors and sponsor data", async () => {
      const tripSponsorRecords = [
        createMockTripSponsorRecord({
          id: "ts-1",
          tripId: "trip-123",
          sponsorId: "sponsor-1",
        }),
      ];
      const sponsorRecords = [
        createMockSponsorRecord({ id: "sponsor-1", name: "Sponsor One" }),
      ];

      const mockDb = createFindByTripIdConnectionMockDb(
        tripSponsorRecords,
        sponsorRecords,
        false,
      );
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-123", {}),
      );

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]?.sponsor?.name).toBe("Sponsor One");
      expect(result.edges).toHaveLength(1);
    });

    it("returns empty connection when no trip sponsors exist", async () => {
      const mockDb = createFindByTripIdConnectionMockDb([], [], false);
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-empty", {}),
      );

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns connection with hasNextPage when more results exist", async () => {
      const tripSponsorRecords = [
        createMockTripSponsorRecord({
          id: "ts-1",
          tripId: "trip-123",
          sponsorId: "sponsor-1",
        }),
      ];
      const sponsorRecords = [createMockSponsorRecord({ id: "sponsor-1" })];

      const mockDb = createFindByTripIdConnectionMockDb(
        tripSponsorRecords,
        sponsorRecords,
        true,
      );
      const gateway = new DrizzleSponsorGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-123", { first: 1 }),
      );

      expect(result.nodes).toHaveLength(1);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns connection with hasPreviousPage when cursor provided", async () => {
      const tripSponsorRecords = [
        createMockTripSponsorRecord({
          id: "ts-2",
          tripId: "trip-123",
          sponsorId: "sponsor-2",
        }),
      ];
      const sponsorRecords = [createMockSponsorRecord({ id: "sponsor-2" })];

      const mockDb = createFindByTripIdConnectionMockDb(
        tripSponsorRecords,
        sponsorRecords,
        false,
      );
      const gateway = new DrizzleSponsorGateway(mockDb);

      const args: SponsorConnectionArgs = {
        first: 1,
        after: { id: "ts-1", createdAt: new Date().toISOString() },
      };

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-123", args),
      );

      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSponsorGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripIdConnection("trip-123", {})),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripIdConnection");
      }
    });
  });
});
