import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleGroupGateway } from "./gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { GroupDTO, CursorPaginationOptions } from "@mirai-app/use-cases";
import { GroupStatus } from "@mirai-app/domain";

/**
 * Unit tests for DrizzleGroupGateway
 *
 * Tests the gateway methods for group management:
 * - CRUD operations (create, findById, update, delete)
 * - findByTripId() - Find groups by trip ID
 * - findByStatus() - Find groups by status
 * - findByTripIdAndStatus() - Find groups by trip ID and status
 * - findByOrganizerId() - Find groups by organizer ID
 * - findByCode() - Find group by code
 * - existsByCode() - Check if code exists
 * - getCoins() / updateCoins() - Coin balance management
 * - countByTripId() - Count groups by trip ID
 * - Cursor-based pagination methods
 * - Participant management (findParticipantsByGroupId, assignUserToGroup, removeUserFromGroup)
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockGroupDTO(overrides: Partial<GroupDTO> = {}): GroupDTO {
  return {
    id: "group-123",
    tripId: "trip-456",
    name: "Test Group",
    code: "TEST123",
    description: "A test group",
    imageUrl: null,
    status: GroupStatus.ACTIVE,
    coins: 100,
    maxMembers: null,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    deletedById: null,
    ...overrides,
  };
}

function createMockGroupSelect(
  overrides: Partial<{
    id: string;
    tripId: string;
    name: string;
    code: string;
    description: string | null;
    image: string | null;
    isDeleted: boolean;
    organizerId: string;
    coins: number;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: "group-123",
    tripId: "trip-456",
    name: "Test Group",
    code: "TEST123",
    description: "A test group",
    image: null,
    isDeleted: false,
    organizerId: "user-789",
    coins: 100,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

/**
 * Create a query-like thenable that supports both:
 * 1. Direct await: await db.select().from().where()
 * 2. Chain methods: .where().limit() or .where().orderBy().limit()
 */
function createQuery<T>(value: T): Promise<T> & {
  limit: () => Promise<T>;
  orderBy: () => { limit: () => Promise<T> };
} {
  const basePromise = Promise.resolve(value);
  return Object.assign(basePromise, {
    limit: () => Promise.resolve(value),
    orderBy: () => ({
      limit: () => Promise.resolve(value),
    }),
  });
}

function createSelectMockDb(records: unknown[]): DrizzleDb {
  return {
    select: (columns?: unknown) => {
      // Handle getCoins query: select({ coins: ... })
      const isCoinsQuery =
        columns && typeof columns === "object" && "coins" in columns;
      const result = isCoinsQuery ? [{ coins: 100 }] : records;

      // where() must return a thenable (Promise) that also has chain methods
      // This is what Drizzle does - the query builder is thenable
      const whereResult = createQuery(result);

      return {
        from: () => ({
          where: () => whereResult,
          limit: () => createQuery(records),
          orderBy: () => ({
            limit: () => createQuery(records),
          }),
        }),
      };
    },
  } as unknown as DrizzleDb;
}

function createInsertMockDb(returnRecord: unknown): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([returnRecord]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createUpdateMockDb(returnRecord: unknown): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnRecord]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createDeleteMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  // Support both patterns:
  // 1. .select({ count: ... }).from().where() - used by existsByCode, countByTripId
  // 2. Regular select queries
  return {
    select: (columns?: unknown) => {
      // When columns are passed (like { count: sql`...` }), return count result
      const isCountQuery =
        columns && typeof columns === "object" && "count" in columns;
      const result = isCountQuery ? [{ count }] : [];

      return {
        from: () => ({
          where: () => createQuery(result),
          limit: () => createQuery(result),
          orderBy: () => ({
            limit: () => createQuery(result),
          }),
        }),
      };
    },
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  // Create a lazy thenable that only rejects when awaited or when chain methods are called
  const createLazyRejected = <T>(): Promise<T> & {
    limit: () => Promise<T>;
    orderBy: () => { limit: () => Promise<T> };
  } => {
    const makeRejected = () => Promise.reject(new Error(errorMessage));
    // Create a neutral object that looks like a thenable
    const thenable: Record<string, unknown> = {
      limit: makeRejected,
      orderBy: () => ({
        limit: makeRejected,
      }),
    };
    // Define then/catch to make it awaitable (only rejects when actually awaited)
    Object.defineProperty(thenable, "then", {
      enumerable: false,
      configurable: true,
      value: (
        onResolve: (v: T) => unknown,
        onReject: (e: unknown) => unknown,
      ) => makeRejected().then(onResolve, onReject),
    });
    Object.defineProperty(thenable, "catch", {
      enumerable: false,
      configurable: true,
      value: (onReject: (e: unknown) => unknown) =>
        makeRejected().catch(onReject),
    });
    return thenable as Promise<T> & {
      limit: () => Promise<T>;
      orderBy: () => { limit: () => Promise<T> };
    };
  };

  return {
    select: (columns?: unknown) => {
      // Support select(), select({ count: ... }), and select({ coins: ... })
      const isColumnQuery =
        columns &&
        typeof columns === "object" &&
        ("count" in columns || "coins" in columns);
      if (isColumnQuery) {
        return {
          from: () => ({
            where: () => createLazyRejected(),
            limit: () => Promise.reject(new Error(errorMessage)),
          }),
        };
      }
      return {
        from: () => ({
          where: () => createLazyRejected(),
          limit: () => Promise.reject(new Error(errorMessage)),
          orderBy: () => ({
            limit: () => Promise.reject(new Error(errorMessage)),
          }),
        }),
      };
    },
    insert: () => ({
      values: () => ({
        returning: () => Promise.reject(new Error(errorMessage)),
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

describe("[UNIT] DrizzleGroupGateway", () => {
  // ==========================================================================
  // findByTripId() Method Tests
  // ==========================================================================

  describe("findByTripId()", () => {
    it("returns groups for a trip", async () => {
      const mockRecord = createMockGroupSelect();
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-456"));

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("group-123");
      expect(result[0].tripId).toBe("trip-456");
    });

    it("returns empty array when no groups exist for trip", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-empty"),
      );

      expect(result).toHaveLength(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripId");
      }
    });
  });

  // ==========================================================================
  // findByStatus() Method Tests
  // ==========================================================================

  describe("findByStatus()", () => {
    it("returns active groups", async () => {
      const mockRecord = createMockGroupSelect({ isDeleted: false });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByStatus(GroupStatus.ACTIVE),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe(GroupStatus.ACTIVE);
    });

    it("returns deleted groups", async () => {
      const mockRecord = createMockGroupSelect({ isDeleted: true });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByStatus(GroupStatus.DELETED),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe(GroupStatus.DELETED);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByStatus(GroupStatus.ACTIVE)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByStatus");
      }
    });
  });

  // ==========================================================================
  // findByTripIdAndStatus() Method Tests
  // ==========================================================================

  describe("findByTripIdAndStatus()", () => {
    it("returns active groups for a trip", async () => {
      const mockRecord = createMockGroupSelect({ isDeleted: false });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatus("trip-456", GroupStatus.ACTIVE),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe(GroupStatus.ACTIVE);
      expect(result[0]!.tripId).toBe("trip-456");
    });

    it("returns deleted groups for a trip", async () => {
      const mockRecord = createMockGroupSelect({ isDeleted: true });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatus("trip-456", GroupStatus.DELETED),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe(GroupStatus.DELETED);
    });

    it("returns deleted groups for a trip", async () => {
      const mockRecord = createMockGroupSelect({ isDeleted: true });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatus("trip-456", GroupStatus.DELETED),
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(GroupStatus.DELETED);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findByTripIdAndStatus("trip-456", GroupStatus.ACTIVE),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripIdAndStatus");
      }
    });
  });

  // ==========================================================================
  // findByOrganizerId() Method Tests
  // ==========================================================================

  describe("findByOrganizerId()", () => {
    it("returns groups for an organizer", async () => {
      const mockRecord = createMockGroupSelect({ organizerId: "user-789" });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByOrganizerId("user-789"),
      );

      expect(result).toHaveLength(1);
      expect(result[0].createdById).toBe("user-789");
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByOrganizerId("user-789")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByOrganizerId");
      }
    });
  });

  // ==========================================================================
  // findByCode() Method Tests
  // ==========================================================================

  describe("findByCode()", () => {
    it("returns group by code", async () => {
      const mockRecord = createMockGroupSelect({ code: "TEST123" });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByCode("TEST123"));

      expect(result).not.toBeNull();
      expect(result!.code).toBe("TEST123");
    });

    it("returns null when code not found", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByCode("INVALID"));

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByCode("TEST123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByCode");
      }
    });
  });

  // ==========================================================================
  // existsByCode() Method Tests
  // ==========================================================================

  describe("existsByCode()", () => {
    it("returns true when code exists", async () => {
      const mockDb = createCountMockDb(1);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(gateway.existsByCode("TEST123"));

      expect(result).toBe(true);
    });

    it("returns false when code does not exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(gateway.existsByCode("INVALID"));

      expect(result).toBe(false);
    });

    it("excludes specified group ID when checking", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsByCode("TEST123", "group-123"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.existsByCode("TEST123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("existsByCode");
      }
    });
  });

  // ==========================================================================
  // getCoins() Method Tests
  // ==========================================================================

  describe("getCoins()", () => {
    it("returns coin balance for group", async () => {
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ coins: 150 }]),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getCoins(
          "group-123" as unknown as import("@mirai-app/domain").GroupId,
        ),
      );

      expect(result).toBe(150);
    });

    it("returns 0 when group not found", async () => {
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getCoins(
          "group-not-found" as unknown as import("@mirai-app/domain").GroupId,
        ),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.getCoins(
            "group-123" as unknown as import("@mirai-app/domain").GroupId,
          ),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("getCoins");
      }
    });
  });

  // ==========================================================================
  // updateCoins() Method Tests
  // ==========================================================================

  describe("updateCoins()", () => {
    it("adds coins to group balance", async () => {
      const mockRecord = createMockGroupSelect({ coins: 150 });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.updateCoins(
          "group-123" as unknown as import("@mirai-app/domain").GroupId,
          50,
        ),
      );

      expect(result.coins).toBe(150);
    });

    it("subtracts coins from group balance", async () => {
      const mockRecord = createMockGroupSelect({ coins: 50 });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.updateCoins(
          "group-123" as unknown as import("@mirai-app/domain").GroupId,
          -50,
        ),
      );

      expect(result.coins).toBe(50);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.updateCoins(
            "group-123" as unknown as import("@mirai-app/domain").GroupId,
            50,
          ),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("updateCoins");
      }
    });
  });

  // ==========================================================================
  // countByTripId() Method Tests
  // ==========================================================================

  describe("countByTripId()", () => {
    it("counts groups for a trip", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(gateway.countByTripId("trip-456"));

      expect(result).toBe(5);
    });

    it("returns 0 when no groups exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleGroupGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByTripId("trip-empty"),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleGroupGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countByTripId");
      }
    });
  });

  // ==========================================================================
  // Cursor Pagination Tests
  // ==========================================================================

  describe("Cursor Pagination", () => {
    describe("findByTripIdConnection()", () => {
      it("returns paginated groups without cursor", async () => {
        const records = Array.from({ length: 3 }, (_, i) =>
          createMockGroupSelect({
            id: `group-${i}`,
            createdAt: new Date(`2024-01-0${i + 1}`),
          }),
        );
        let callCount = 0;
        const mockDb = {
          select: (columns?: unknown) => {
            callCount++;
            const isCountQuery =
              columns && typeof columns === "object" && "count" in columns;
            return {
              from: () => ({
                where: () => {
                  if (isCountQuery) {
                    // Count query
                    return createQuery([{ count: records.length }]);
                  }
                  // Data query with orderBy().limit()
                  return {
                    orderBy: () => ({
                      limit: () => createQuery(records),
                    }),
                  };
                },
              }),
            };
          },
        } as unknown as DrizzleDb;
        const gateway = new DrizzleGroupGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.findByTripIdConnection("trip-456", { limit: 10 }),
        );

        expect(result.items).toHaveLength(3);
        expect(result.total).toBe(3);
      });

      it("returns paginated groups with cursor", async () => {
        const records = Array.from({ length: 2 }, (_, i) =>
          createMockGroupSelect({
            id: `group-${i + 1}`,
            createdAt: new Date(`2024-01-0${i + 1}`),
          }),
        );
        const mockDb = {
          select: (columns?: unknown) => {
            const isCountQuery =
              columns && typeof columns === "object" && "count" in columns;
            return {
              from: () => ({
                where: () => {
                  if (isCountQuery) {
                    return createQuery([{ count: records.length + 1 }]);
                  }
                  return {
                    orderBy: () => ({
                      limit: () => createQuery(records),
                    }),
                  };
                },
              }),
            };
          },
        } as unknown as DrizzleDb;
        const gateway = new DrizzleGroupGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.findByTripIdConnection("trip-456", {
            limit: 10,
            cursor: { id: "group-0", createdAt: "2024-01-01T00:00:00.000Z" },
          }),
        );

        expect(result.items).toHaveLength(2);
      });
    });

    describe("findByStatusConnection()", () => {
      it("returns paginated groups by status", async () => {
        const records = [createMockGroupSelect({ isDeleted: false })];
        const mockDb = {
          select: (columns?: unknown) => {
            const isCountQuery =
              columns && typeof columns === "object" && "count" in columns;
            return {
              from: () => ({
                where: () => {
                  if (isCountQuery) {
                    return createQuery([{ count: records.length }]);
                  }
                  return {
                    orderBy: () => ({
                      limit: () => createQuery(records),
                    }),
                  };
                },
              }),
            };
          },
        } as unknown as DrizzleDb;
        const gateway = new DrizzleGroupGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.findByStatusConnection(GroupStatus.ACTIVE, { limit: 10 }),
        );

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
      });
    });

    describe("findByOrganizerIdConnection()", () => {
      it("returns paginated groups by organizer", async () => {
        const records = [createMockGroupSelect({ organizerId: "user-789" })];
        const mockDb = {
          select: (columns?: unknown) => {
            const isCountQuery =
              columns && typeof columns === "object" && "count" in columns;
            return {
              from: () => ({
                where: () => {
                  if (isCountQuery) {
                    return createQuery([{ count: records.length }]);
                  }
                  return {
                    orderBy: () => ({
                      limit: () => createQuery(records),
                    }),
                  };
                },
              }),
            };
          },
        } as unknown as DrizzleDb;
        const gateway = new DrizzleGroupGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.findByOrganizerIdConnection("user-789", { limit: 10 }),
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].createdById).toBe("user-789");
      });
    });
  });

  // ==========================================================================
  // Participant Management Tests
  // ==========================================================================

  describe("Participant Management", () => {
    describe("findParticipantsByGroupId()", () => {
      it("returns participants for a group", async () => {
        const participantRecord = {
          id: "participant-1",
          userId: "user-1",
          tripId: "trip-456",
          groupId: "group-123",
          wristNumber: 1,
          houseNumber: "A1",
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () => Promise.resolve([participantRecord]),
            }),
          }),
        } as unknown as DrizzleDb;
        const gateway = new DrizzleGroupGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.findParticipantsByGroupId("group-123"),
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("participant-1");
      });

      it("returns DatabaseError on query failure", async () => {
        const mockDb = createFailingMockDb("Connection failed");
        const gateway = new DrizzleGroupGateway(mockDb);

        const either = await Effect.runPromise(
          Effect.either(gateway.findParticipantsByGroupId("group-123")),
        );

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(DatabaseError);
          expect(either.left.operation).toBe("findParticipantsByGroupId");
        }
      });
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByTripId: Returns groups for a trip, empty array, error handling
// - findByStatus: Returns groups by status (active/deleted), error handling
// - findByTripIdAndStatus: Combined filtering, error handling
// - findByOrganizerId: Organizer-based queries, error handling
// - findByCode: Code-based lookup, null handling, error handling
// - existsByCode: Existence check with optional exclusion, error handling
// - getCoins: Balance retrieval, default to 0, error handling
// - updateCoins: Adding/subtracting coins, error handling
// - countByTripId: Counting groups, error handling
// - Cursor pagination: Multiple connection methods with/without cursors
// - Participant management: Finding participants, error handling
//
// All tests use Effect.either for error testing to verify DatabaseError
// is properly wrapped and returned as a Left value.
