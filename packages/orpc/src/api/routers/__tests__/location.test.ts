 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { locationRouter } from "../../routers/location";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, Location, TripParticipant, LocationSharingRequest } from "@mirai-app/db";
import type * as locationValidationModule from "../../../utils/location-validation";

vi.mock("../../../utils/location-validation", async (importOriginal) => {
  const actual = await importOriginal<typeof locationValidationModule>();
  return {
    ...actual,
    calculateDistance: vi.fn().mockReturnValue(5.0),
  };
});

vi.mock("../../../utils/tripGuards", () => ({
  ensureTripNotEnded: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
    dbUser: {
      id: "user-123",
      authUserId: "auth-123",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      hasAvatar: false,
      lastSeenOn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
}));

const createCaller = (ctx: TRPCContext) => createRouterClient(locationRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "USER",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock location
const createMockLocation = (overrides: Partial<Location> = {}): Location => ({
  id: "location-123",
  userId: "user-123",
  latitude: 52.2297,
  longitude: 21.0122,
  accuracy: 10,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
  timestamp: new Date(),
  isSharingLocation: true,
  ...overrides,
});

// Helper to create mock trip participant
const createMockParticipant = (overrides: Partial<TripParticipant> = {}): TripParticipant => ({
  id: "participant-123",
  userId: "user-123",
  tripId: "trip-123",
  groupId: "group-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock location sharing request
const createMockSharingRequest = (overrides: Partial<LocationSharingRequest> = {}): LocationSharingRequest => ({
  id: "request-123",
  senderId: "user-456",
  receiverId: "user-123",
  status: "PENDING",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("locationRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockLocation: Location;
  let mockParticipant: TripParticipant;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = createMockUser({ id: "user-123" });
    mockLocation = createMockLocation({ id: "location-123", userId: "user-123" });
    mockParticipant = createMockParticipant({ id: "participant-123", userId: "user-123", tripId: "trip-123" });

    // Setup mock database client
    mockDb = {
      location: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      tripParticipant: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findMany: vi.fn(),
      },
      locationSharingRequest: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      locationShare: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn().mockImplementation(<T>(
        fn: ((client: typeof mockDb) => Promise<T>) | Promise<T>[]
      ): Promise<T | T[]> => {
        if (typeof fn === "function") {
          return fn(mockDb);
        }
        return Promise.all(fn);
      }),
    };

    const lastResults: Record<string, unknown> = {};

    function toCamelCase(str: string): string {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function getModelName(table: unknown): string {
      let name: string | undefined;
      if (typeof table === 'string') {
        name = table;
      } else if (table && typeof table === 'object') {
        const obj = table as Record<string | symbol, unknown>;
        if (typeof obj.name === 'string') {
          name = obj.name;
        } else {
          const drizzleNameSym = Symbol.for('drizzle:Name');
          if (typeof obj[drizzleNameSym] === 'string') {
            name = obj[drizzleNameSym];
          } else {
            const sym = Object.getOwnPropertySymbols(obj).find(
              (s) => s.description === 'drizzle:Name'
            );
            if (sym && typeof obj[sym] === 'string') {
              name = obj[sym];
            }
          }
        }
      }
      if (!name) return 'unknown';
      const singular = name.replace(/ies$/, 'y').replace(/s$/, '');
      return toCamelCase(singular);
    }

    const db = mockDb as Record<string, unknown>;

    db.query = new Proxy({}, {
      get(_, tableName) {
        const name = String(tableName);
        const singular = name.replace(/ies$/, 'y').replace(/s$/, '');
        const model = db[singular] ?? db[name];
        if (model && typeof model === 'object') {
          const modelObj = model as Record<string, (...args: unknown[]) => Promise<unknown>>;
          return new Proxy(modelObj, {
            get(_, methodName) {
              const method = String(methodName);
              if (method === 'findFirst' || method === 'findUnique') {
                return async (...args: unknown[]) => {
                  if (modelObj[method]) {
                    const result = await modelObj[method](...args);
                    if (result !== null && result !== undefined) {
                      return result;
                    }
                    const otherMethod = method === 'findFirst' ? 'findUnique' : 'findFirst';
                    if (modelObj[otherMethod]) {
                      const fb = await modelObj[otherMethod](...args);
                      if (fb !== null && fb !== undefined) {
                        return fb;
                      }
                    }
                    return lastResults[singular] ?? null;
                  }
                  const otherMethod = method === 'findFirst' ? 'findUnique' : 'findFirst';
                  if (modelObj[otherMethod]) {
                    const fb = await modelObj[otherMethod](...args);
                    if (fb !== null && fb !== undefined) {
                      return fb;
                    }
                  }
                  return lastResults[singular] ?? null;
                };
              }
              return modelObj[method];
            },
          });
        }
        return { findFirst: vi.fn(() => Promise.resolve(null)), findUnique: vi.fn(() => Promise.resolve(null)), findMany: vi.fn(() => Promise.resolve([])) };
      },
    });

    db.insert = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        values: vi.fn((data: unknown) => {
          const returningFn = () => {
            const model = db[modelName];
            if (model && typeof model === 'object' && 'create' in model) {
              return (model as Record<string, unknown>).create({ data }).then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            returning: returningFn,
            onConflictDoNothing: returningFn,
            onConflictDoUpdate: (_opts: unknown) => ({
              returning: () => {
                const model = db[modelName];
                if (model && typeof model === 'object' && 'upsert' in model) {
                  return (model as Record<string, unknown>).upsert({ data }).then((result: unknown) => {
                    if (result != null) lastResults[modelName] = result;
                    return [result];
                  });
                }
                return Promise.resolve([{}]);
              },
              then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
                const model = db[modelName];
                if (model && typeof model === 'object' && 'upsert' in model) {
                  return (model as Record<string, unknown>).upsert({ data }).then((result: unknown) => {
                    if (result != null) lastResults[modelName] = result;
                    return resolve([result]);
                  }, reject);
                }
                return resolve([{}]);
              },
            }),
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => returningFn().then(resolve, reject),
          };
        }),
      };
    });

    db.update = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        set: vi.fn((data: unknown) => {
          const execute = () => {
            const model = db[modelName];
            if (model && typeof model === 'object' && 'update' in model) {
              return (model as Record<string, unknown>).update({ data }).then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            where: vi.fn(() => ({
              returning: execute,
              then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => execute().then(resolve, reject),
            })),
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => execute().then(resolve, reject),
          };
        }),
      };
    });

    db.delete = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        where: vi.fn(() => {
          const execute = () => {
            const model = db[modelName];
            if (model && typeof model === 'object' && 'delete' in model) {
              return (model as Record<string, unknown>).delete().then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            returning: execute,
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => execute().then(resolve, reject),
          };
        }),
      };
    });

    db.select = vi.fn((fields?: unknown) => {
      let primaryTable: string | undefined;
      let hasGroupBy = false;
      const fieldNames = fields && typeof fields === 'object' ? Object.keys(fields) : [];
      const hasCountOnly = fieldNames.length === 1 && fieldNames[0] === 'count';
      const hasAggregateFields = fieldNames.some((f) => ['count', 'sum', 'avg', 'min', 'max'].includes(f));
      const chainable: any = {
        from: (table: unknown) => {
          primaryTable = getModelName(table);
          return chainable;
        },
        innerJoin: () => chainable,
        leftJoin: () => chainable,
        where: () => chainable,
        orderBy: () => chainable,
        limit: () => chainable,
        offset: () => chainable,
        groupBy: () => {
          hasGroupBy = true;
          return chainable;
        },
        having: () => chainable,
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
          if (primaryTable) {
            const model = db[primaryTable];
            if (model && typeof model === 'object') {
              if (hasGroupBy && 'groupBy' in model) {
                return (model as Record<string, unknown>).groupBy().then((groups: unknown) => {
                  const mapped = (groups as Record<string, unknown>[]).map((row) => {
                    const item: Record<string, unknown> = {};
                    for (const field of fieldNames) {
                      if (field in row) {
                        item[field] = row[field];
                      } else if (field === 'count' && (row as Record<string, Record<string, unknown>>)._count) {
                        item.count = (row as Record<string, Record<string, unknown>>)._count.id ?? (row as Record<string, Record<string, unknown>>)._count._all ?? 0;
                      }
                    }
                    return item;
                  });
                  return resolve(mapped);
                }, reject);
              }
              if (hasCountOnly && 'count' in model) {
                return (model as Record<string, unknown>).count().then((count: unknown) => resolve([{ count }]), reject);
              }
              if (hasAggregateFields && 'aggregate' in model) {
                return (model as Record<string, unknown>).aggregate().then((aggResult: unknown) => {
                  const mapped: Record<string, unknown> = {};
                  const agg = aggResult as Record<string, Record<string, unknown>>;
                  for (const field of fieldNames) {
                    if (field === 'count' && agg._count) {
                      mapped.count = agg._count.id ?? agg._count._all ?? 0;
                    } else if (agg._sum && field in agg._sum) {
                      mapped[field] = agg._sum[field];
                    } else if (agg._avg && field in agg._avg) {
                      mapped[field] = agg._avg[field];
                    }
                  }
                  return resolve([mapped]);
                }, reject);
              }
              if ('findMany' in model) {
                return (model as Record<string, unknown>).findMany().then((results: unknown) => resolve(results), reject);
              }
              if ('count' in model) {
                return (model as Record<string, unknown>).count().then((count: unknown) => resolve([{ count }]), reject);
              }
              if ('aggregate' in model) {
                return (model as Record<string, unknown>).aggregate().then((agg: unknown) => resolve([agg]), reject);
              }
            }
          }
          return resolve([]);
        },
      };
      return chainable;
    });

    db.transaction = vi.fn(async (callback: unknown) => {
      if (typeof callback === "function") {
        return await (callback as (db: typeof db) => unknown)(db);
      }
      return Promise.all(callback as unknown[]);
    });

    db.$transaction = vi.fn(async (callback: unknown) => {
      if (typeof callback === "function") {
        return await (callback as (db: typeof db) => unknown)(db);
      }
      return Promise.all(callback as unknown[]);
    });

    mockDb = db as unknown as DB;

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-123", email: "test@example.com" } },
            error: null,
          }),
        },
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://signed-url.example.com/avatar.jpg" },
            error: null,
          }),
        }),
      },
    };
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId || "auth-123" },
    dbUser: user,
  });

  describe("updateLocation", () => {
    it("should update user location successfully", async () => {
      const updatedLocation = createMockLocation({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 5,
      });
      mockDb.location.upsert.mockResolvedValue(updatedLocation);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.updateLocation({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 5,
      });

      expect(result.latitude).toBe(52.2297);
      expect(result.longitude).toBe(21.0122);
      expect(mockDb.location.upsert).toHaveBeenCalled();
    });

    it("should create new location if none exists", async () => {
      mockDb.location.upsert.mockResolvedValue(mockLocation);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.updateLocation({
        latitude: 52.2297,
        longitude: 21.0122,
      });

      expect(result).toBeDefined();
      expect(mockDb.location.upsert).toHaveBeenCalled();
    });

    it("should handle location with all optional fields", async () => {
      const fullLocation = createMockLocation({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 5,
        altitude: 100,
        altitudeAccuracy: 2,
        heading: 90,
        speed: 5.5,
      });
      mockDb.location.upsert.mockResolvedValue(fullLocation);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.updateLocation({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 5,
        altitude: 100,
        altitudeAccuracy: 2,
        heading: 90,
        speed: 5.5,
      });

      expect(result.altitude).toBe(100);
      expect(result.heading).toBe(90);
      expect(result.speed).toBe(5.5);
      expect(mockDb.location.upsert).toHaveBeenCalled();
    });
  });

  describe("getMyLocation", () => {
    it("should return current user's location", async () => {
      mockDb.location.findFirst.mockResolvedValue(mockLocation);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyLocation();

      expect(result).toEqual(mockLocation);
    });

    it("should return null when user has no location", async () => {
      mockDb.location.findFirst.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyLocation();

      expect(result).toBeNull();
    });
  });

  describe("getFriendsLocations", () => {
    it("should return friends' locations", async () => {
      const friendLocation = createMockLocation({
        id: "location-456",
        userId: "user-456",
        isSharingLocation: true,
      });
      const friendUser = createMockUser({
        id: "user-456",
        firstName: "Friend",
        lastName: "User",
        hasAvatar: true,
      });

      mockDb.locationShare.findMany.mockResolvedValue([{ locationId: "location-456" }]);
      mockDb.location.findMany.mockResolvedValue([{
        ...friendLocation,
        user: friendUser,
      }]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getFriendsLocations();

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-456");
    });

    it("should only return locations where user is in sharing list", async () => {
      mockDb.location.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getFriendsLocations();

      expect(result).toEqual([]);
    });
  });

  describe("getMySharingSettings", () => {
    it("should return sharing settings when location exists", async () => {
      const locationWithUsers = {
        ...mockLocation,
        usersToShareWith: [
          { user: createMockUser({ id: "user-456", firstName: "Friend", lastName: "One" }) },
          { user: createMockUser({ id: "user-789", firstName: "Friend", lastName: "Two" }) },
        ],
      };
      mockDb.location.findFirst.mockResolvedValue(locationWithUsers);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMySharingSettings();

      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(2);
    });

    it("should return default settings when no location exists", async () => {
      mockDb.location.findFirst.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMySharingSettings();

      expect(result.isSharingLocation).toBe(false);
      expect(result.usersToShareWith).toEqual([]);
    });
  });

  describe("updateSharingSettings", () => {
    it("should update sharing settings successfully", async () => {
      const updatedLocation = {
        ...mockLocation,
        isSharingLocation: true,
        usersToShareWith: [
          createMockUser({ id: "user-456", firstName: "Friend", lastName: "One" }),
        ],
      };
      mockDb.location.upsert.mockResolvedValue(updatedLocation);
      mockDb.tripParticipant.findFirst.mockResolvedValue(mockParticipant);
      mockDb.tripParticipant.findMany.mockResolvedValue([
        { userId: "user-456" },
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.updateSharingSettings({
        isSharingLocation: true,
        userIdsToShareWith: ["user-456"],
        tripId: "trip-123",
      });

      expect(result.isSharingLocation).toBe(true);
      expect(mockDb.location.upsert).toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when user is not in active trip", async () => {
      mockDb.tripParticipant.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.updateSharingSettings({
          isSharingLocation: true,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate shareable targets when userIds provided", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue(mockParticipant);
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({ userId: "user-456", tripId: "trip-123" }),
      ]);

      const updatedLocation = {
        ...mockLocation,
        isSharingLocation: true,
        usersToShareWith: [createMockUser({ id: "user-456" })],
      };
      mockDb.location.upsert.mockResolvedValue(updatedLocation);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.updateSharingSettings({
        isSharingLocation: true,
        userIdsToShareWith: ["user-456"],
        tripId: "trip-123",
      });

      expect(result.isSharingLocation).toBe(true);
    });
  });

  describe("getAllUsersForSharing", () => {
    it.skip("should return shareable users for trip", async () => {
      const shareableUsers = [
        createMockUser({ id: "user-456", firstName: "Friend", lastName: "One", hasAvatar: true }),
        createMockUser({ id: "user-789", firstName: "Friend", lastName: "Two", hasAvatar: false }),
      ];
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({ userId: "user-456", tripId: "trip-123" }),
        createMockParticipant({ userId: "user-789", tripId: "trip-123" }),
      ]);
      mockDb.user.findMany.mockResolvedValue(shareableUsers);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAllUsersForSharing({ tripId: "trip-123" });

      expect(result).toHaveLength(2);
    });

    it("should return empty array when user has no trips", async () => {
      mockDb.tripParticipant.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAllUsersForSharing({});

      expect(result).toEqual([]);
    });

    it("should return users from all trips when no tripId specified", async () => {
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({ userId: "user-456", tripId: "trip-123" }),
        createMockParticipant({ userId: "user-789", tripId: "trip-456" }),
      ]);
      mockDb.user.findMany.mockResolvedValue([
        createMockUser({ id: "user-456" }),
        createMockUser({ id: "user-789" }),
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAllUsersForSharing({});

      expect(result).toHaveLength(2);
    });
  });

  describe("addUserToSharing", () => {
    it("should add user to sharing list", async () => {
      mockDb.location.upsert.mockResolvedValue(mockLocation);
      mockDb.locationShare.findMany.mockResolvedValue([{ userId: "user-456" }]);
      mockDb.user.findMany.mockResolvedValue([createMockUser({ id: "user-456", firstName: "Friend", lastName: "One" })]);
      let callCount = 0;
      mockDb.tripParticipant.findMany.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              userId: "user-123",
              tripId: "trip-123",
              trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            },
          ]);
        }
        if (callCount === 2) {
          return Promise.resolve([{ tripId: "trip-123" }]);
        }
        return Promise.resolve([{ userId: "user-456" }]);
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.addUserToSharing({ userId: "user-456" });

      expect(result.success).toBe(true);
      expect(result.usersToShareWith).toHaveLength(1);
    });

    it("should throw BAD_REQUEST when adding self", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addUserToSharing({ userId: "user-123" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when user is outside sharing scope", async () => {
      mockDb.tripParticipant.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addUserToSharing({ userId: "user-456" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("removeUserFromSharing", () => {
    it("should remove user from sharing list", async () => {
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({
          userId: "user-123",
          tripId: "trip-123",
          trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        }),
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.removeUserFromSharing({ userId: "user-456" });

      expect(result.success).toBe(true);
      expect(result.usersToShareWith).toEqual([]);
    });
  });

  describe("requestLocationSharing", () => {
    it("should create new sharing request", async () => {
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(null);
      mockDb.locationSharingRequest.create.mockResolvedValue(
        createMockSharingRequest({ id: "new-request-123" })
      );
      let callCount = 0;
      mockDb.tripParticipant.findMany.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              userId: "user-123",
              tripId: "trip-123",
              trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            },
          ]);
        }
        if (callCount === 2) {
          return Promise.resolve([{ tripId: "trip-123" }]);
        }
        return Promise.resolve([{ userId: "user-456" }]);
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.requestLocationSharing({ receiverId: "user-456" });

      expect(result.success).toBe(true);
      expect(result.request.id).toBe("new-request-123");
    });

    it("should throw BAD_REQUEST when requesting self", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.requestLocationSharing({ receiverId: "user-123" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when request already pending", async () => {
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(
        createMockSharingRequest({ status: "PENDING" })
      );
      let callCount = 0;
      mockDb.tripParticipant.findMany.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              userId: "user-123",
              tripId: "trip-123",
              trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            },
          ]);
        }
        if (callCount === 2) {
          return Promise.resolve([{ tripId: "trip-123" }]);
        }
        return Promise.resolve([{ userId: "user-456" }]);
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.requestLocationSharing({ receiverId: "user-456" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when already sharing", async () => {
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(
        createMockSharingRequest({ status: "ACCEPTED" })
      );
      let callCount = 0;
      mockDb.tripParticipant.findMany.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              userId: "user-123",
              tripId: "trip-123",
              trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            },
          ]);
        }
        if (callCount === 2) {
          return Promise.resolve([{ tripId: "trip-123" }]);
        }
        return Promise.resolve([{ userId: "user-456" }]);
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.requestLocationSharing({ receiverId: "user-456" })
      ).rejects.toThrow(ORPCError);
    });

    it("should update rejected request to pending", async () => {
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(
        createMockSharingRequest({ status: "REJECTED" })
      );
      mockDb.locationSharingRequest.update.mockResolvedValue(
        createMockSharingRequest({ status: "PENDING" })
      );
      let callCount = 0;
      mockDb.tripParticipant.findMany.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([
            {
              userId: "user-123",
              tripId: "trip-123",
              trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            },
          ]);
        }
        if (callCount === 2) {
          return Promise.resolve([{ tripId: "trip-123" }]);
        }
        return Promise.resolve([{ userId: "user-456" }]);
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.requestLocationSharing({ receiverId: "user-456" });

      expect(result.success).toBe(true);
      expect(mockDb.locationSharingRequest.update).toHaveBeenCalled();
    });
  });

  describe("acceptLocationSharingRequest", () => {
    it("should accept sharing request and add mutual sharing", async () => {
      const request = createMockSharingRequest({
        id: "request-123",
        senderId: "user-456",
        receiverId: "user-123",
        status: "PENDING",
      });
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(request);
      mockDb.transaction.mockImplementation(<T>(
        fn: ((client: typeof mockDb) => Promise<T>) | Promise<T>[]
      ): Promise<T | T[]> => {
        if (typeof fn === "function") {
          return fn(mockDb);
        }
        return Promise.all(fn);
      });
      mockDb.locationSharingRequest.update.mockResolvedValue(
        createMockSharingRequest({ status: "ACCEPTED" })
      );
      mockDb.location.upsert.mockResolvedValue(mockLocation);
      mockDb.locationShare.findMany.mockResolvedValue([{ userId: "user-123" }]);
      mockDb.user.findMany.mockResolvedValue([createMockUser({ id: "user-456", firstName: "Sender", lastName: "One" })]);
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({
          userId: "user-123",
          tripId: "trip-123",
          trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        }),
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.acceptLocationSharingRequest({ requestId: "request-123" });

      expect(result.success).toBe(true);
      expect(result.request.status).toBe("ACCEPTED");
    });

    it("should throw NOT_FOUND when request doesn't exist", async () => {
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.acceptLocationSharingRequest({ requestId: "non-existent" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when user is not the receiver", async () => {
      const request = createMockSharingRequest({
        senderId: "user-456",
        receiverId: "user-789", // Different from current user
        status: "PENDING",
      });
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(request);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.acceptLocationSharingRequest({ requestId: "request-123" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when request is not pending", async () => {
      const request = createMockSharingRequest({
        senderId: "user-456",
        receiverId: "user-123",
        status: "ACCEPTED",
      });
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(request);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.acceptLocationSharingRequest({ requestId: "request-123" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("rejectLocationSharingRequest", () => {
    it("should reject sharing request", async () => {
      const request = createMockSharingRequest({
        id: "request-123",
        senderId: "user-456",
        receiverId: "user-123",
        status: "PENDING",
      });
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(request);
      mockDb.locationSharingRequest.update.mockResolvedValue(
        createMockSharingRequest({ status: "REJECTED" })
      );
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({
          userId: "user-123",
          tripId: "trip-123",
          trip: { id: "trip-123", endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        }),
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.rejectLocationSharingRequest({ requestId: "request-123" });

      expect(result.success).toBe(true);
      expect(result.request.status).toBe("REJECTED");
    });

    it("should throw NOT_FOUND when request doesn't exist", async () => {
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.rejectLocationSharingRequest({ requestId: "non-existent" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when user is not the receiver", async () => {
      const request = createMockSharingRequest({
        senderId: "user-456",
        receiverId: "user-789",
        status: "PENDING",
      });
      mockDb.locationSharingRequest.findFirst.mockResolvedValue(request);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.rejectLocationSharingRequest({ requestId: "request-123" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("getPendingLocationSharingRequests", () => {
    it("should return pending requests for current user", async () => {
      const pendingRequests = [
        createMockSharingRequest({
          id: "request-1",
          senderId: "user-456",
          receiverId: "user-123",
          sender: createMockUser({ id: "user-456", firstName: "Sender", lastName: "One" }),
        }),
        createMockSharingRequest({
          id: "request-2",
          senderId: "user-789",
          receiverId: "user-123",
          sender: createMockUser({ id: "user-789", firstName: "Sender", lastName: "Two" }),
        }),
      ];
      mockDb.locationSharingRequest.findMany.mockResolvedValue(pendingRequests);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getPendingLocationSharingRequests();

      expect(result).toHaveLength(2);
      expect(mockDb.locationSharingRequest.findMany).toHaveBeenCalled();
    });

    it("should return empty array when no pending requests", async () => {
      mockDb.locationSharingRequest.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getPendingLocationSharingRequests();

      expect(result).toEqual([]);
    });
  });

  describe("getMyLocationSharingRequests", () => {
    it("should return all sent and received requests", async () => {
      const sentRequests = [
        createMockSharingRequest({
          id: "request-1",
          senderId: "user-123",
          receiverId: "user-456",
          receiver: createMockUser({ id: "user-456", firstName: "Receiver", lastName: "One" }),
        }),
      ];
      const receivedRequests = [
        createMockSharingRequest({
          id: "request-2",
          senderId: "user-789",
          receiverId: "user-123",
          sender: createMockUser({ id: "user-789", firstName: "Sender", lastName: "One" }),
        }),
      ];
      mockDb.locationSharingRequest.findMany.mockResolvedValueOnce(sentRequests)
        .mockResolvedValueOnce(receivedRequests);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyLocationSharingRequests();

      expect(result.sent).toHaveLength(1);
      expect(result.received).toHaveLength(1);
    });

    it("should return empty arrays when no requests exist", async () => {
      mockDb.locationSharingRequest.findMany.mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyLocationSharingRequests();

      expect(result.sent).toEqual([]);
      expect(result.received).toEqual([]);
    });
  });
});
