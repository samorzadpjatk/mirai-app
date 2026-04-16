import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleUserGateway } from "./gateway";
import { DatabaseError, UserRole } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { UserDTO, UserConnectionArgs } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleUserGateway
 *
 * Tests the gateway methods for user management:
 * - Base CRUD operations (inherited from BaseDrizzleGateway)
 * - findByAuthUserId() - Find user by auth ID
 * - findByIds() - Find users by IDs
 * - existsByAuthUserId() - Check user existence
 * - updateLastSeen() - Update last seen timestamp
 * - searchByName() - Search by name
 * - findAllConnection() / findByRoleConnection() - Cursor pagination
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

/**
 * Create a mock UserSelect record from Drizzle
 */
function createMockUserSelect(
  overrides: {
    id?: string;
    authUserId?: string;
    firstName?: string | null;
    lastName?: string | null;
    hasAvatar?: boolean;
    role?: string;
    lastSeenOn?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
): {
  id: string;
  authUserId: string;
  firstName: string | null;
  lastName: string | null;
  hasAvatar: boolean;
  role: string;
  lastSeenOn: Date | null;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: overrides.id ?? "user-123",
    authUserId: overrides.authUserId ?? "auth-user-456",
    firstName: overrides.firstName ?? "John",
    lastName: overrides.lastName ?? "Doe",
    hasAvatar: overrides.hasAvatar ?? false,
    role: overrides.role ?? "USER",
    lastSeenOn: overrides.lastSeenOn ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01T00:00:00Z"),
  };
}

/**
 * Create a mock UserDTO
 */
function createMockUserDTO(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: overrides.id ?? "user-123",
    authUserId: overrides.authUserId ?? "auth-user-456",
    firstName: overrides.firstName ?? "John",
    lastName: overrides.lastName ?? "Doe",
    nickname: overrides.nickname ?? null,
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    avatarUrl: overrides.avatarUrl ?? null,
    role: overrides.role ?? UserRole.USER,
    status: overrides.status ?? ("active" as UserDTO["status"]),
    groupId: overrides.groupId ?? null,
    bio: overrides.bio ?? null,
    birthDate: overrides.birthDate ?? null,
    shirtSize: overrides.shirtSize ?? null,
    dietaryRequirements: overrides.dietaryRequirements ?? null,
    medicalInfo: overrides.medicalInfo ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01T00:00:00Z"),
  };
}

// ============================================================================
// Mock Drizzle Db Factories
// ============================================================================

/**
 * Create a mock DrizzleDb for findById queries
 */
function createFindByIdMockDb(
  record: ReturnType<typeof createMockUserSelect> | null,
): DrizzleDb {
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
 * Create a mock DrizzleDb for findByAuthUserId queries
 */
function createFindByAuthUserIdMockDb(
  record: ReturnType<typeof createMockUserSelect> | null,
): DrizzleDb {
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
 * Create a mock DrizzleDb for findByIds queries
 */
function createFindByIdsMockDb(
  records: ReturnType<typeof createMockUserSelect>[],
): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(records),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for existsByAuthUserId queries
 */
function createExistsMockDb(exists: boolean): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(exists ? [{ id: "user-123" }] : []),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for create operations
 */
function createCreateMockDb(
  record: ReturnType<typeof createMockUserSelect>,
): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([record]),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for update operations
 */
function createUpdateMockDb(
  record: ReturnType<typeof createMockUserSelect>,
): DrizzleDb {
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
 * Create a mock DrizzleDb for delete operations
 */
function createDeleteMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for updateLastSeen operations
 */
function createUpdateLastSeenMockDb(
  shouldFail = false,
  errorMessage = "",
): DrizzleDb {
  if (shouldFail) {
    return {
      update: () => ({
        set: () => ({
          where: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    } as unknown as DrizzleDb;
  }
  return {
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for findAll with pagination
 */
function createFindAllMockDb(
  records: ReturnType<typeof createMockUserSelect>[],
  totalCount: number,
): DrizzleDb {
  let selectCallCount = 0;

  return {
    select: (columns?: Record<string, unknown>) => {
      selectCallCount++;
      // First call is count query (has count column)
      if (selectCallCount === 1) {
        return {
          from: () => Promise.resolve([{ count: totalCount }]),
        };
      }
      // Second call is the data query - return a thenable chain
      const createQueryChain = (): unknown => {
        const chain = {
          orderBy: () => chain,
          limit: () => chain,
          offset: () => chain,
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(records).then(resolve),
        };
        return chain;
      };
      return {
        from: () => createQueryChain(),
      };
    },
  } as unknown as DrizzleDb;
}

/**
 * Create a mock DrizzleDb for connection queries (findAllConnection, findByRoleConnection)
 */
function createConnectionMockDb(
  records: ReturnType<typeof createMockUserSelect>[],
): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(records),
          }),
        }),
      }),
    }),
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
        }),
      }),
    }),
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

describe("[UNIT] DrizzleUserGateway", () => {
  // ==========================================================================
  // findById() Method Tests (from BaseDrizzleGateway)
  // ==========================================================================

  describe("findById()", () => {
    it("finds user by ID and returns DTO", async () => {
      const mockRecord = createMockUserSelect({ id: "user-123" });
      const mockDb = createFindByIdMockDb(mockRecord);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.findById("user-123"));

      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe("user-123");
        expect(result.authUserId).toBe("auth-user-456");
        expect(result.firstName).toBe("John");
        expect(result.lastName).toBe("Doe");
        expect(result.role).toBe(UserRole.USER);
      }
    });

    it("returns null when user not found", async () => {
      const mockDb = createFindByIdMockDb(null);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.findById("nonexistent"));

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Database connection failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findById("user-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findById");
      }
    });
  });

  // ==========================================================================
  // findByAuthUserId() Method Tests
  // ==========================================================================

  describe("findByAuthUserId()", () => {
    it("finds user by authUserId and returns DTO", async () => {
      const mockRecord = createMockUserSelect({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "Jane",
        lastName: "Smith",
        role: "ADMIN",
      });
      const mockDb = createFindByAuthUserIdMockDb(mockRecord);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByAuthUserId("auth-456"),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-123");
      expect(result?.authUserId).toBe("auth-456");
      expect(result?.firstName).toBe("Jane");
      expect(result?.lastName).toBe("Smith");
      expect(result?.role).toBe(UserRole.ADMIN);
    });

    it("returns null when user not found by authUserId", async () => {
      const mockDb = createFindByAuthUserIdMockDb(null);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByAuthUserId("nonexistent-auth"),
      );

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByAuthUserId("auth-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByAuthUserId");
      }
    });
  });

  // ==========================================================================
  // findByIds() Method Tests
  // ==========================================================================

  describe("findByIds()", () => {
    it("finds multiple users by IDs", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          authUserId: "auth-1",
          firstName: "User1",
        }),
        createMockUserSelect({
          id: "user-2",
          authUserId: "auth-2",
          firstName: "User2",
        }),
        createMockUserSelect({
          id: "user-3",
          authUserId: "auth-3",
          firstName: "User3",
        }),
      ];
      const mockDb = createFindByIdsMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByIds(["user-1", "user-2", "user-3"]),
      );

      expect(result).toHaveLength(3);
      expect(result[0]?.id).toBe("user-1");
      expect(result[1]?.id).toBe("user-2");
      expect(result[2]?.id).toBe("user-3");
    });

    it("returns empty array when no IDs provided", async () => {
      const mockDb = createFindByIdsMockDb([]);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByIds([]));

      expect(result).toHaveLength(0);
    });

    it("returns empty array when no users found", async () => {
      const mockDb = createFindByIdsMockDb([]);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByIds(["nonexistent-1", "nonexistent-2"]),
      );

      expect(result).toHaveLength(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByIds(["user-1"])),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByIds");
      }
    });
  });

  // ==========================================================================
  // existsByAuthUserId() Method Tests
  // ==========================================================================

  describe("existsByAuthUserId()", () => {
    it("returns true when user exists", async () => {
      const mockDb = createExistsMockDb(true);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsByAuthUserId("auth-existing"),
      );

      expect(result).toBe(true);
    });

    it("returns false when user does not exist", async () => {
      const mockDb = createExistsMockDb(false);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsByAuthUserId("auth-nonexistent"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.existsByAuthUserId("auth-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("existsByAuthUserId");
      }
    });
  });

  // ==========================================================================
  // create() Method Tests (from BaseDrizzleGateway)
  // ==========================================================================

  describe("create()", () => {
    it("creates a new user and returns DTO", async () => {
      const mockRecord = createMockUserSelect({
        id: "new-user-123",
        authUserId: "new-auth-456",
        firstName: "New",
        lastName: "User",
      });
      const mockDb = createCreateMockDb(mockRecord);
      const gateway = new DrizzleUserGateway(mockDb);

      const userDTO = createMockUserDTO({
        id: "new-user-123",
        authUserId: "new-auth-456",
        firstName: "New",
        lastName: "User",
      });

      const result = await Effect.runPromise(gateway.create(userDTO));

      expect(result.id).toBe("new-user-123");
      expect(result.authUserId).toBe("new-auth-456");
      expect(result.firstName).toBe("New");
      expect(result.lastName).toBe("User");
    });

    it("returns DatabaseError on insert failure", async () => {
      const mockDb = createFailingMockDb("Insert failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const userDTO = createMockUserDTO({ id: "user-123" });

      const either = await Effect.runPromise(
        Effect.either(gateway.create(userDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("create");
      }
    });
  });

  // ==========================================================================
  // update() Method Tests (from BaseDrizzleGateway)
  // ==========================================================================

  describe("update()", () => {
    it("updates user and returns updated DTO", async () => {
      const mockRecord = createMockUserSelect({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "Updated",
        lastName: "Name",
      });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleUserGateway(mockDb);

      const userDTO = createMockUserDTO({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "Updated",
        lastName: "Name",
      });

      const result = await Effect.runPromise(gateway.update(userDTO));

      expect(result.id).toBe("user-123");
      expect(result.firstName).toBe("Updated");
      expect(result.lastName).toBe("Name");
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Update failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const userDTO = createMockUserDTO({ id: "user-123" });

      const either = await Effect.runPromise(
        Effect.either(gateway.update(userDTO)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("update");
      }
    });
  });

  // ==========================================================================
  // delete() Method Tests (from BaseDrizzleGateway)
  // ==========================================================================

  describe("delete()", () => {
    it("deletes user successfully", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.delete("user-123"));

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Delete failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.delete("user-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("delete");
      }
    });
  });

  // ==========================================================================
  // updateLastSeen() Method Tests
  // ==========================================================================

  describe("updateLastSeen()", () => {
    it("updates last seen timestamp successfully", async () => {
      const mockDb = createUpdateLastSeenMockDb(false);
      const gateway = new DrizzleUserGateway(mockDb);

      const lastSeenOn = new Date("2024-06-15T10:30:00Z");

      const result = await Effect.runPromise(
        gateway.updateLastSeen("user-123", lastSeenOn),
      );

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createUpdateLastSeenMockDb(true, "Update failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.updateLastSeen("user-123", new Date())),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("updateLastSeen");
      }
    });
  });

  // ==========================================================================
  // findAll() Method Tests (from BaseDrizzleGateway)
  // ==========================================================================

  describe("findAll()", () => {
    it("returns paginated users", async () => {
      const mockRecords = [
        createMockUserSelect({ id: "user-1", firstName: "User1" }),
        createMockUserSelect({ id: "user-2", firstName: "User2" }),
      ];
      const mockDb = createFindAllMockDb(mockRecords, 10);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findAll({ limit: 2, offset: 0 }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(0);
    });

    it("returns empty result when no users exist", async () => {
      const mockDb = createFindAllMockDb([], 0);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.findAll());

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(Effect.either(gateway.findAll()));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findAll");
      }
    });
  });

  // ==========================================================================
  // searchByName() Method Tests
  // ==========================================================================

  describe("searchByName()", () => {
    it("returns users matching first name", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          firstName: "Johnathon",
          lastName: "Doe",
        }),
        createMockUserSelect({
          id: "user-2",
          firstName: "John",
          lastName: "Smith",
        }),
        createMockUserSelect({
          id: "user-3",
          firstName: "Jane",
          lastName: "Doe",
        }),
      ];
      const mockDb = createFindAllMockDb(mockRecords, 3);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.searchByName("john"));

      expect(result).toHaveLength(2);
      expect(result[0]?.firstName).toBe("Johnathon");
      expect(result[1]?.firstName).toBe("John");
    });

    it("returns users matching last name", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          firstName: "John",
          lastName: "Smith",
        }),
        createMockUserSelect({
          id: "user-2",
          firstName: "Jane",
          lastName: "Smith",
        }),
        createMockUserSelect({
          id: "user-3",
          firstName: "Bob",
          lastName: "Johnson",
        }),
      ];
      const mockDb = createFindAllMockDb(mockRecords, 3);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.searchByName("smith"));

      expect(result).toHaveLength(2);
      expect(result[0]?.lastName).toBe("Smith");
      expect(result[1]?.lastName).toBe("Smith");
    });

    it("returns empty array when no users match", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        }),
      ];
      const mockDb = createFindAllMockDb(mockRecords, 1);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.searchByName("xyz"));

      expect(result).toHaveLength(0);
    });

    it("performs case-insensitive search", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          firstName: "JOHN",
          lastName: "DOE",
        }),
        createMockUserSelect({
          id: "user-2",
          firstName: "john",
          lastName: "doe",
        }),
      ];
      const mockDb = createFindAllMockDb(mockRecords, 2);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.searchByName("John"));

      expect(result).toHaveLength(2);
    });

    it("returns DatabaseError when findAll fails", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.searchByName("john")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // findAllConnection() Method Tests
  // ==========================================================================

  describe("findAllConnection()", () => {
    it("returns connection with users", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          firstName: "User1",
          createdAt: new Date("2024-01-03"),
        }),
        createMockUserSelect({
          id: "user-2",
          firstName: "User2",
          createdAt: new Date("2024-01-02"),
        }),
      ];
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 2 };
      const result = await Effect.runPromise(gateway.findAllConnection(args));

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns hasNextPage=true when more results exist", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          createdAt: new Date("2024-01-03"),
        }),
        createMockUserSelect({
          id: "user-2",
          createdAt: new Date("2024-01-02"),
        }),
        createMockUserSelect({
          id: "user-3",
          createdAt: new Date("2024-01-01"),
        }),
      ];
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 2 };
      const result = await Effect.runPromise(gateway.findAllConnection(args));

      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns hasPreviousPage=true when using after cursor", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-2",
          createdAt: new Date("2024-01-02"),
        }),
      ];
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = {
        first: 1,
        after: { id: "user-1", createdAt: "2024-01-03T00:00:00.000Z" },
      };
      const result = await Effect.runPromise(gateway.findAllConnection(args));

      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns edges with valid cursors", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "user-1",
          createdAt: new Date("2024-01-01"),
        }),
      ];
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 1 };
      const result = await Effect.runPromise(gateway.findAllConnection(args));

      expect(result.edges[0]?.cursor).toBeDefined();
      expect(typeof result.edges[0]?.cursor).toBe("string");
      expect(result.edges[0]?.cursor?.length).toBeGreaterThan(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 10 };
      const either = await Effect.runPromise(
        Effect.either(gateway.findAllConnection(args)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findAllConnection");
      }
    });
  });

  // ==========================================================================
  // findByRoleConnection() Method Tests
  // ==========================================================================

  describe("findByRoleConnection()", () => {
    it("returns users with specified role", async () => {
      const mockRecords = [
        createMockUserSelect({
          id: "admin-1",
          firstName: "Admin1",
          role: "ADMIN",
        }),
        createMockUserSelect({
          id: "admin-2",
          firstName: "Admin2",
          role: "ADMIN",
        }),
      ];
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 2 };
      const result = await Effect.runPromise(
        gateway.findByRoleConnection(UserRole.ADMIN, args),
      );

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0]?.role).toBe(UserRole.ADMIN);
      expect(result.nodes[1]?.role).toBe(UserRole.ADMIN);
    });

    it("returns empty connection when no users with role exist", async () => {
      const mockDb = createConnectionMockDb([]);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 10 };
      const result = await Effect.runPromise(
        gateway.findByRoleConnection(UserRole.MODERATOR, args),
      );

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns hasNextPage=true when more admins exist", async () => {
      const mockRecords = [
        createMockUserSelect({ id: "admin-1", role: "ADMIN" }),
        createMockUserSelect({ id: "admin-2", role: "ADMIN" }),
        createMockUserSelect({ id: "admin-3", role: "ADMIN" }),
      ];
      const mockDb = createConnectionMockDb(mockRecords);
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 2 };
      const result = await Effect.runPromise(
        gateway.findByRoleConnection(UserRole.ADMIN, args),
      );

      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const args: UserConnectionArgs = { first: 10 };
      const either = await Effect.runPromise(
        Effect.either(gateway.findByRoleConnection(UserRole.USER, args)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByRoleConnection");
      }
    });
  });

  // ==========================================================================
  // exists() Method Tests (from BaseDrizzleGateway)
  // ==========================================================================

  describe("exists()", () => {
    it("returns true when user exists", async () => {
      const mockRecord = createMockUserSelect({ id: "user-123" });
      const mockDb = createFindByIdMockDb(mockRecord);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.exists("user-123"));

      expect(result).toBe(true);
    });

    it("returns false when user does not exist", async () => {
      const mockDb = createFindByIdMockDb(null);
      const gateway = new DrizzleUserGateway(mockDb);

      const result = await Effect.runPromise(gateway.exists("nonexistent"));

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Query failed");
      const gateway = new DrizzleUserGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.exists("user-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("exists");
      }
    });
  });
});
