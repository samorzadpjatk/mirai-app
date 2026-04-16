import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleLocationGateway } from "./gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { LocationDTO, LocationConnectionArgs } from "@mirai-app/use-cases";
import type { LocationSharingRequestConnectionArgs } from "@mirai-app/domain";
import type {
  LocationSelect,
  LocationSharingRequestSelect,
} from "@mirai-app/frameworks/drizzle/schema";

/**
 * Unit tests for DrizzleLocationGateway
 *
 * Tests the gateway methods for location management:
 * - CRUD: create(), findById(), findAll(), save(), delete()
 * - User-specific: findByUserId(), deleteByUserId(), existsForUser()
 * - Cursor pagination (Relay): findSharingWithUserConnection(), findByUserIdsConnection()
 * - Sharing requests: findSharingRequestsConnection(), findReceivedSharingRequestsConnection()
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

/**
 * Create a mock LocationDTO for testing
 */
function createMockLocationDTO(
  overrides: Partial<LocationDTO> = {},
): LocationDTO {
  const now = new Date("2024-01-15T10:00:00Z");
  return {
    id: "loc-123",
    userId: "user-456",
    latitude: 52.2297,
    longitude: 21.0122,
    accuracy: 10,
    altitude: 100,
    speed: 5.5,
    heading: 90,
    recordedAt: now,
    createdAt: now,
    isSharingLocation: true,
    usersToShareWith: [],
    ...overrides,
  };
}

/**
 * Create a mock LocationSelect record (Drizzle return type)
 */
function createMockLocationSelect(
  overrides: Partial<LocationSelect> = {},
): LocationSelect {
  const now = new Date("2024-01-15T10:00:00Z");
  return {
    id: "loc-123",
    userId: "user-456",
    latitude: 52.2297,
    longitude: 21.0122,
    accuracy: 10,
    altitude: 100,
    altitudeAccuracy: null,
    speed: 5.5,
    heading: 90,
    timestamp: now,
    isSharingLocation: true,
    lastInactivityNotification: null,
    ...overrides,
  } as LocationSelect;
}

/**
 * Create a mock LocationSharingRequestSelect record
 */
function createMockLocationSharingRequestSelect(
  overrides: Partial<LocationSharingRequestSelect> = {},
): LocationSharingRequestSelect {
  const now = new Date("2024-01-15T10:00:00Z");
  return {
    id: "req-123",
    requesterId: "user-456",
    targetId: "user-789",
    status: "ACCEPTED",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as LocationSharingRequestSelect;
}

/**
 * Create an array of mock locations for pagination testing
 */
function createMockLocations(count: number): LocationSelect[] {
  return Array.from({ length: count }, (_, i) =>
    createMockLocationSelect({
      id: `loc-${i + 1}`,
      userId: `user-${(i % 3) + 1}`,
      latitude: 52.2297 + i * 0.001,
      longitude: 21.0122 + i * 0.001,
      timestamp: new Date(Date.UTC(2024, 0, 15, 10, i, 0)),
    }),
  );
}

// ============================================================================
// Mock Drizzle Db Factories
// ============================================================================

/**
 * Create a mock DrizzleDb for single record queries (findById, findByUserId)
 */
function createSingleRecordMockDb(record: LocationSelect | null): DrizzleDb {
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
 * Create a mock DrizzleDb for insert operations (create)
 */
function createInsertMockDb(record: LocationSelect): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([record]),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for update operations (save with existing record)
 */
function createUpdateMockDb(updatedRecord: LocationSelect): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([updatedRecord]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for update-then-insert pattern (save with no existing record)
 */
function createUpsertMockDb(
  updateResult: null | LocationSelect,
  insertRecord: LocationSelect,
): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(updateResult ? [updateResult] : []),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([insertRecord]),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for delete operations
 */
function createDeleteMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(undefined),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for findAll with pagination
 *
 * The gateway's findAll method makes two queries:
 * 1. Select records: db.select().from(table) -> chainable query with .limit() and .offset()
 * 2. Count total: db.select({ count: count() }).from(table) -> directly returns Promise<[{ count: number }]>
 */
function createFindAllMockDb(
  records: LocationSelect[],
  totalCount: number,
): DrizzleDb {
  let callCount = 0;

  return {
    select: (columns?: { count: unknown }) => {
      callCount++;
      const isCountQuery = columns !== undefined;

      if (isCountQuery) {
        // Count query: db.select({ count: count() }).from(table)
        return {
          from: () => Promise.resolve([{ count: totalCount }]),
        };
      }

      // Records query: db.select().from(table) returns chainable query builder
      // The gateway calls: query = db.select().from(table); query.limit(); query.offset(); await query;
      const createQueryBuilder = () => {
        const builder = {
          limit: function () {
            return builder;
          },
          offset: function () {
            return builder;
          },
          then: function (
            onFulfilled: (value: LocationSelect[]) => unknown,
            onRejected?: (reason: Error) => unknown,
          ) {
            return Promise.resolve(records).then(onFulfilled, onRejected);
          },
        };
        return builder;
      };

      return {
        from: () => createQueryBuilder(),
      };
    },
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for cursor-based pagination queries
 *
 * Pattern: db.select().from(table).where().orderBy().orderBy().limit()
 */
function createConnectionMockDb(records: LocationSelect[]): DrizzleDb {
  const createQueryBuilder = () => {
    const builder = {
      orderBy: () => builder,
      limit: () => Promise.resolve(records),
    };
    return builder;
  };

  return {
    select: () => ({
      from: () => ({
        where: () => createQueryBuilder(),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb that always fails
 */
function createFailingMockDb(errorMessage: string): DrizzleDb {
  const error = new Error(errorMessage);

  // Create a failing query builder that rejects when awaited
  const createFailingQueryBuilder = () => {
    return {
      limit: function () {
        return this;
      },
      offset: function () {
        return this;
      },
      orderBy: function () {
        return this;
      },
      then: function (
        _onFulfilled: (value: unknown) => unknown,
        onRejected: (reason: Error) => unknown,
      ) {
        return Promise.reject(error).then(_onFulfilled, onRejected);
      },
    };
  };

  return {
    select: (columns?: { count: unknown; id?: unknown }) => {
      if (columns !== undefined) {
        // Count query or select with specific columns
        return {
          from: () => ({
            where: () => ({
              limit: () => Promise.reject(error),
            }),
          }),
        };
      }
      // Records query: db.select().from(table).limit().offset()
      return {
        from: () => createFailingQueryBuilder(),
      };
    },
    insert: () => ({
      values: () => ({
        returning: () => Promise.reject(error),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(error),
        }),
      }),
    }),
    delete: () => ({
      where: () => Promise.reject(error),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for location sharing request queries
 *
 * Pattern: db.select().from(locationSharingRequests).where().orderBy().orderBy().limit()
 */
function createSharingRequestMockDb(
  records: LocationSharingRequestSelect[],
): DrizzleDb {
  const createQueryBuilder = () => {
    const builder = {
      orderBy: () => builder,
      limit: () => Promise.resolve(records),
    };
    return builder;
  };

  return {
    select: () => ({
      from: () => ({
        where: () => createQueryBuilder(),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleLocationGateway", () => {
  // ==========================================================================
  // create() Method Tests
  // ==========================================================================

  describe("create()", () => {
    it("creates a new location and returns LocationDTO", async () => {
      const mockRecord = createMockLocationSelect({
        id: "loc-new",
        userId: "user-789",
      });
      const mockDb = createInsertMockDb(mockRecord);
      const gateway = new DrizzleLocationGateway(mockDb);

      const locationDTO = createMockLocationDTO({
        id: "loc-new",
        userId: "user-789",
      });

      const result = await Effect.runPromise(gateway.create(locationDTO));

      expect(result.id).toBe("loc-new");
      expect(result.userId).toBe("user-789");
      expect(result.latitude).toBe(52.2297);
      expect(result.longitude).toBe(21.0122);
    });

    it("returns DatabaseError on insert failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);
      const locationDTO = createMockLocationDTO();

      const either = await Effect.runPromise(
        Effect.either(gateway.create(locationDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("create");
      }
    });
  });

  // ==========================================================================
  // findById() Method Tests
  // ==========================================================================

  describe("findById()", () => {
    it("finds location by ID and returns LocationDTO", async () => {
      const mockRecord = createMockLocationSelect({ id: "loc-123" });
      const mockDb = createSingleRecordMockDb(mockRecord);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findById("loc-123" as never),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("loc-123");
      expect(result?.userId).toBe("user-456");
    });

    it("returns null when location not found", async () => {
      const mockDb = createSingleRecordMockDb(null);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findById("nonexistent" as never),
      );

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findById("loc-123" as never)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findById");
      }
    });
  });

  // ==========================================================================
  // findByUserId() Method Tests
  // ==========================================================================

  describe("findByUserId()", () => {
    it("finds location by user ID and returns LocationDTO", async () => {
      const mockRecord = createMockLocationSelect({
        userId: "user-789",
        id: "loc-789",
      });
      const mockDb = createSingleRecordMockDb(mockRecord);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByUserId("user-789"));

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-789");
      expect(result?.id).toBe("loc-789");
    });

    it("returns null when no location exists for user", async () => {
      const mockDb = createSingleRecordMockDb(null);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByUserId("user-without-location"),
      );

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByUserId("user-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByUserId");
      }
    });
  });

  // ==========================================================================
  // findAll() Method Tests
  // ==========================================================================

  describe("findAll()", () => {
    it("finds all locations with default pagination", async () => {
      const mockRecords = createMockLocations(5);
      const mockDb = createFindAllMockDb(mockRecords, 5);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll());

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(false);
    });

    it("finds locations with custom limit", async () => {
      const mockRecords = createMockLocations(3);
      const mockDb = createFindAllMockDb(mockRecords, 10);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll({ limit: 3 }));

      expect(result.items).toHaveLength(3);
      expect(result.limit).toBe(3);
    });

    it("finds locations with offset", async () => {
      const mockRecords = createMockLocations(5);
      const mockDb = createFindAllMockDb(mockRecords, 15);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll({ offset: 10 }));

      expect(result.offset).toBe(10);
      expect(result.hasMore).toBe(false); // 10 + 5 = 15, which is not < 15
    });

    it("returns hasMore=true when more results exist", async () => {
      const mockRecords = createMockLocations(10);
      const mockDb = createFindAllMockDb(mockRecords, 25);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findAll({ limit: 10, offset: 0 }),
      );

      expect(result.hasMore).toBe(true);
    });

    it("returns empty result when no locations exist", async () => {
      const mockDb = createFindAllMockDb([], 0);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll());

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(Effect.either(gateway.findAll()));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findAll");
      }
    });
  });

  // ==========================================================================
  // save() Method Tests (Upsert Pattern)
  // ==========================================================================

  describe("save()", () => {
    it("updates existing location when record exists", async () => {
      const updatedRecord = createMockLocationSelect({
        id: "loc-123",
        userId: "user-456",
        latitude: 53.0,
        longitude: 22.0,
      });
      const mockDb = createUpdateMockDb(updatedRecord);
      const gateway = new DrizzleLocationGateway(mockDb);

      const locationDTO = createMockLocationDTO({
        id: "loc-123",
        userId: "user-456",
        latitude: 53.0,
        longitude: 22.0,
      });

      const result = await Effect.runPromise(gateway.save(locationDTO));

      expect(result.latitude).toBe(53.0);
      expect(result.longitude).toBe(22.0);
    });

    it("creates new location when no existing record", async () => {
      const newRecord = createMockLocationSelect({
        id: "loc-new",
        userId: "user-new",
      });
      const mockDb = createUpsertMockDb(null, newRecord);
      const gateway = new DrizzleLocationGateway(mockDb);

      const locationDTO = createMockLocationDTO({
        id: "loc-new",
        userId: "user-new",
      });

      const result = await Effect.runPromise(gateway.save(locationDTO));

      expect(result.id).toBe("loc-new");
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);
      const locationDTO = createMockLocationDTO();

      const either = await Effect.runPromise(
        Effect.either(gateway.save(locationDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("save");
      }
    });
  });

  // ==========================================================================
  // delete() Method Tests
  // ==========================================================================

  describe("delete()", () => {
    it("deletes location by ID", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleLocationGateway(mockDb);

      await Effect.runPromise(gateway.delete("loc-123" as never));

      // If no error thrown, test passes
      expect(true).toBe(true);
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.delete("loc-123" as never)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("delete");
      }
    });
  });

  // ==========================================================================
  // deleteByUserId() Method Tests
  // ==========================================================================

  describe("deleteByUserId()", () => {
    it("deletes location by user ID", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleLocationGateway(mockDb);

      await Effect.runPromise(gateway.deleteByUserId("user-456"));

      // If no error thrown, test passes
      expect(true).toBe(true);
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.deleteByUserId("user-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("deleteByUserId");
      }
    });
  });

  // ==========================================================================
  // existsForUser() Method Tests
  // ==========================================================================

  describe("existsForUser()", () => {
    it("returns true when location exists for user", async () => {
      const mockRecord = createMockLocationSelect({ userId: "user-789" });
      const mockDb = createSingleRecordMockDb(mockRecord);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(gateway.existsForUser("user-789"));

      expect(result).toBe(true);
    });

    it("returns false when no location exists for user", async () => {
      const mockDb = createSingleRecordMockDb(null);
      const gateway = new DrizzleLocationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsForUser("user-without-location"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.existsForUser("user-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("existsForUser");
      }
    });
  });

  // ==========================================================================
  // Cursor Pagination: findSharingWithUserConnection() Tests
  // ==========================================================================

  describe("findSharingWithUserConnection()", () => {
    it("returns connection with default pagination", async () => {
      const mockRecords = createMockLocations(5);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("user-123", args),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns connection with hasNextPage when more results exist", async () => {
      const mockRecords = createMockLocations(21);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = { first: 20 };
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("user-123", args),
      );

      expect(result.edges).toHaveLength(20);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns connection with cursors", async () => {
      const mockRecords = createMockLocations(3);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("user-123", args),
      );

      expect(result.edges[0]?.cursor).toBeDefined();
      expect(result.pageInfo.startCursor).toBe(result.edges[0]?.cursor ?? null);
      expect(result.pageInfo.endCursor).toBe(
        result.edges[result.edges.length - 1]?.cursor ?? null,
      );
    });

    it("respects first parameter for pagination limit", async () => {
      const mockRecords = createMockLocations(50);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = { first: 10 };
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("user-123", args),
      );

      expect(result.edges.length).toBeLessThanOrEqual(10);
    });

    it("enforces maximum limit of 100", async () => {
      const mockRecords = createMockLocations(105);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = { first: 150 };
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("user-123", args),
      );

      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findSharingWithUserConnection("user-123", {})),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findSharingWithUserConnection");
      }
    });
  });

  // ==========================================================================
  // Cursor Pagination: findByUserIdsConnection() Tests
  // ==========================================================================

  describe("findByUserIdsConnection()", () => {
    it("returns connection for user IDs", async () => {
      const mockRecords = createMockLocations(5);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1", "user-2"], args),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes).toHaveLength(5);
    });

    it("returns empty connection for empty userIds array", async () => {
      const mockDb = createConnectionMockDb([]);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection([], args),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns connection with pagination", async () => {
      const mockRecords = createMockLocations(25);
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationConnectionArgs = { first: 10 };
      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1", "user-2", "user-3"], args),
      );

      expect(result.edges.length).toBeLessThanOrEqual(10);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByUserIdsConnection(["user-1"], {})),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByUserIdsConnection");
      }
    });
  });

  // ==========================================================================
  // Sharing Requests: findSharingRequestsConnection() Tests
  // ==========================================================================

  describe("findSharingRequestsConnection()", () => {
    it("returns connection of sharing requests sent by user", async () => {
      const mockRecords = [
        createMockLocationSharingRequestSelect({
          id: "req-1",
          requesterId: "user-123",
          targetId: "user-456",
          status: "ACCEPTED",
        }),
        createMockLocationSharingRequestSelect({
          id: "req-2",
          requesterId: "user-123",
          targetId: "user-789",
          status: "PENDING",
        }),
      ];
      const mockDb = createSharingRequestMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findSharingRequestsConnection("user-123", args),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes[0]?.userId).toBe("user-123");
      expect(result.nodes[0]?.sharedWithUserId).toBe("user-456");
      expect(result.nodes[0]?.canViewLocation).toBe(true);
    });

    it("maps ACCEPTED status to canViewLocation=true", async () => {
      const mockRecords = [
        createMockLocationSharingRequestSelect({ status: "ACCEPTED" }),
      ];
      const mockDb = createSharingRequestMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findSharingRequestsConnection("user-123", args),
      );

      expect(result.nodes[0]?.canViewLocation).toBe(true);
    });

    it("maps non-ACCEPTED status to canViewLocation=false", async () => {
      const mockRecords = [
        createMockLocationSharingRequestSelect({ status: "PENDING" }),
        createMockLocationSharingRequestSelect({ status: "REJECTED" }),
      ];
      const mockDb = createSharingRequestMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findSharingRequestsConnection("user-123", args),
      );

      expect(result.nodes[0]?.canViewLocation).toBe(false);
      expect(result.nodes[1]?.canViewLocation).toBe(false);
    });

    it("returns connection with cursors", async () => {
      const mockRecords = [
        createMockLocationSharingRequestSelect({ id: "req-1" }),
        createMockLocationSharingRequestSelect({ id: "req-2" }),
      ];
      const mockDb = createSharingRequestMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findSharingRequestsConnection("user-123", args),
      );

      expect(result.edges[0]?.cursor).toBeDefined();
      expect(result.pageInfo.startCursor).toBeDefined();
      expect(result.pageInfo.endCursor).toBeDefined();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findSharingRequestsConnection("user-123", {})),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findSharingRequestsConnection");
      }
    });
  });

  // ==========================================================================
  // Sharing Requests: findReceivedSharingRequestsConnection() Tests
  // ==========================================================================

  describe("findReceivedSharingRequestsConnection()", () => {
    it("returns connection of sharing requests received by user", async () => {
      const mockRecords = [
        createMockLocationSharingRequestSelect({
          id: "req-1",
          requesterId: "user-456",
          targetId: "user-123",
          status: "ACCEPTED",
        }),
        createMockLocationSharingRequestSelect({
          id: "req-2",
          requesterId: "user-789",
          targetId: "user-123",
          status: "PENDING",
        }),
      ];
      const mockDb = createSharingRequestMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findReceivedSharingRequestsConnection("user-123", args),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes[0]?.userId).toBe("user-456");
      expect(result.nodes[0]?.sharedWithUserId).toBe("user-123");
    });

    it("correctly maps requester to userId and target to sharedWithUserId", async () => {
      const mockRecords = [
        createMockLocationSharingRequestSelect({
          requesterId: "requester-456",
          targetId: "target-123",
          status: "ACCEPTED",
        }),
      ];
      const mockDb = createSharingRequestMockDb(mockRecords);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findReceivedSharingRequestsConnection("target-123", args),
      );

      expect(result.nodes[0]?.userId).toBe("requester-456");
      expect(result.nodes[0]?.sharedWithUserId).toBe("target-123");
    });

    it("returns empty connection when no requests received", async () => {
      const mockDb = createSharingRequestMockDb([]);
      const gateway = new DrizzleLocationGateway(mockDb);

      const args: LocationSharingRequestConnectionArgs = {};
      const result = await Effect.runPromise(
        gateway.findReceivedSharingRequestsConnection("user-no-requests", args),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleLocationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findReceivedSharingRequestsConnection("user-123", {}),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe(
          "findReceivedSharingRequestsConnection",
        );
      }
    });
  });
});
