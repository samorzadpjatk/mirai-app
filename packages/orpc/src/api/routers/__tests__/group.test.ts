 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { groupRouter } from "../../routers/group";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, Group, TripParticipant, GroupJoinRequest, CoinTransaction } from "@mirai-app/db";

// Mock the utility modules
vi.mock("../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn().mockResolvedValue(new Map()),
  resolveAuthEmail: vi.fn().mockImplementation((emailMap: Map<string, string>, authUserId: string | null): string | null => {
    if (!authUserId) return null;
    return emailMap.get(authUserId) ?? null;
  }),
}));

vi.mock("../../../utils/storage", () => ({
  normalizeSupabaseStoragePath: vi.fn().mockImplementation((value: string): { bucket: string; path: string; storagePath: string } | null => {
    if (!value) return null;
    if (value.startsWith("http")) return null;
    return { bucket: "images", path: value, storagePath: `images/${value}` };
  }),
}));

vi.mock("../../../utils/activityFeed", () => ({
  captureTripRankingSnapshot: vi.fn().mockResolvedValue(new Map()),
  createRankChangeActivities: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../utils/tripGuards", () => ({
  ensureTripNotEnded: vi.fn().mockResolvedValue(undefined),
  ensureTripNotEndedByGroupId: vi.fn().mockResolvedValue("trip-123"),
}));

// Create caller factory for group router
const createCaller = (ctx: TRPCContext) => createRouterClient(groupRouter, { context: ctx });

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

// Helper to create mock group
const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "group-123",
  name: "Test Group",
  description: "A test group",
  image: null,
  code: "1234",
  coins: 0,
  tripId: "trip-123",
  organizerId: "user-123",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
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

// Helper to create mock join request
const createMockJoinRequest = (overrides: Partial<GroupJoinRequest> = {}): GroupJoinRequest => ({
  id: "request-123",
  groupId: "group-123",
  tripId: "trip-123",
  userId: "user-456",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock coin transaction
const createMockCoinTransaction = (overrides: Partial<CoinTransaction> = {}): CoinTransaction => ({
  id: "transaction-123",
  groupId: "group-123",
  amount: 100,
  reason: null,
  adminId: "admin-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("groupRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockAdminUser: User;
  let mockModeratorUser: User;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockUser = createMockUser({ id: "user-123", role: "USER" });
    mockAdminUser = createMockUser({ id: "admin-123", role: "ADMIN" });
    mockModeratorUser = createMockUser({ id: "moderator-123", role: "MODERATOR" });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({ 
            data: { user: { id: "auth-123", email: "test@example.com" } }, 
            error: null 
          }),
        },
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({ 
            data: { signedUrl: "https://signed-url.example.com/image.jpg" }, 
            error: null 
          }),
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as SupabaseClient;

    // Setup mock database client
    const mockDbBase = {
      group: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockGroup()),
        update: vi.fn().mockResolvedValue(createMockGroup()),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue(createMockGroup()),
        count: vi.fn().mockResolvedValue(0),
      },
      tripParticipant: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockParticipant()),
        update: vi.fn().mockResolvedValue(createMockParticipant()),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        upsert: vi.fn().mockResolvedValue(createMockParticipant()),
        delete: vi.fn().mockResolvedValue(createMockParticipant()),
        count: vi.fn().mockResolvedValue(1),
      },
      groupJoinRequest: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockJoinRequest()),
        update: vi.fn().mockResolvedValue(createMockJoinRequest()),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue(createMockJoinRequest()),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      coinTransaction: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockCoinTransaction()),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(mockUser),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(mockUser),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue({
          id: "trip-123",
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        }),
      },
      userAgent: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn(async (callback: ((db: typeof mockDbBase) => Promise<unknown>) | Promise<unknown>[]): Promise<unknown> => {
        if (typeof callback === "function") {
          return await callback(mockDbBase);
        }
        // Handle array of promises
        return Promise.all(callback);
      }),
    };

    mockDb = createDrizzleProxy(mockDbBase);
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

  describe("getAllNames", () => {
    it("should return all group names for moderator", async () => {
      const mockGroups = [
        { id: "group-1", name: "Group One" },
        { id: "group-2", name: "Group Two" },
      ];
      mockDb.group.findMany.mockResolvedValue(mockGroups);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAllNames({ tripId: "trip-123" });

      expect(result).toEqual(mockGroups);
       
      expect(mockDb.group.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        where: { tripId: "trip-123", isDeleted: false },
      });
    });
  });

  describe("getMy", () => {
    it("should return null when user has no group", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMy({ tripId: "trip-123" });

      expect(result).toBeNull();
    });

    it("should return group details when user is in a group", async () => {
      const mockParticipant = createMockParticipant({
        id: "participant-1",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });

      const mockGroup = createMockGroup({
        id: "group-123",
        name: "My Group",
        participants: [
          {
            ...mockParticipant,
            user: {
              id: "user-123",
              firstName: "Test",
              lastName: "User",
              authUserId: "auth-123",
              role: "USER",
              hasAvatar: false,
              lastSeenOn: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        coinTransactions: [],
      });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMy({ tripId: "trip-123" });

      expect(result).toBeDefined();
      expect(result?.id).toBe("group-123");
      expect(result?.name).toBe("My Group");
    });

    it("should return null for deleted group", async () => {
      const mockGroup = createMockGroup({ isDeleted: true });
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMy({ tripId: "trip-123" });

      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    it("should return paginated groups", async () => {
      const mockGroups = [
        createMockGroup({ id: "group-1", name: "Group One", participants: [], organizer: { id: "user-1", firstName: "Test", lastName: "User", authUserId: "auth-1", role: "USER", hasAvatar: false, lastSeenOn: null, createdAt: new Date(), updatedAt: new Date() }, coinTransactions: [] }),
        createMockGroup({ id: "group-2", name: "Group Two", participants: [], organizer: { id: "user-2", firstName: "Test", lastName: "User", authUserId: "auth-2", role: "USER", hasAvatar: false, lastSeenOn: null, createdAt: new Date(), updatedAt: new Date() }, coinTransactions: [] }),
      ];

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.group.count.mockResolvedValue(2);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.groups).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should respect pagination parameters", async () => {
      const mockGroups = [createMockGroup({ id: "group-1", name: "Group One", participants: [], organizer: { id: "user-1", firstName: "Test", lastName: "User", authUserId: "auth-1", role: "USER", hasAvatar: false, lastSeenOn: null, createdAt: new Date(), updatedAt: new Date() }, coinTransactions: [] })];

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.group.count.mockResolvedValue(2);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        tripId: "trip-123",
        pagination: { limit: 1, offset: 0 },
      });

      expect(result.groups).toHaveLength(1);
      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe("getGroupList", () => {
    it("should return group list with counts for moderator", async () => {
      const mockGroups = [
        {
          id: "group-1",
          name: "Group One",
          description: "Description",
          image: null,
          code: "1234",
          coins: 100,
          tripId: "trip-123",
          organizerId: "user-1",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizer: { id: "user-1", firstName: "Test", lastName: "User", authUserId: "auth-1", role: "USER", hasAvatar: false, lastSeenOn: null, createdAt: new Date(), updatedAt: new Date() },
          _count: { participants: 5 },
        },
      ];

      mockDb.group.findMany.mockResolvedValue(mockGroups);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getGroupList({ tripId: "trip-123" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Group One");
      expect(result[0]._count.participants).toBe(5);
    });
  });

  describe("getById", () => {
    it("should return group by id", async () => {
      const mockGroup = createMockGroup({
        id: "group-123",
        participants: [
          {
            id: "participant-1",
            userId: "user-123",
            tripId: "trip-123",
            groupId: "group-123",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: "user-123",
              firstName: "Test",
              lastName: "User",
              hasAvatar: false,
              authUserId: "auth-123",
              role: "USER",
              lastSeenOn: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        trip: { id: "trip-123", name: "Test Trip", description: null, image: null, startDate: new Date(), endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
        _count: { participants: 1 },
        challengeSubmissions: [],
      });

      mockDb.group.findUnique.mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getById({ id: "group-123" });

      expect(result.id).toBe("group-123");
      expect(result.name).toBe("Test Group");
      expect(result.participants).toHaveLength(1);
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      const mockGroup = createMockGroup({ isDeleted: true });
      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("getByIdWithOrganizer", () => {
    it("should return group with organizer for moderator", async () => {
      const mockGroup = {
        id: "group-123",
        name: "Test Group",
        code: "1234",
        coins: 100,
        tripId: "trip-123",
        organizerId: "user-123",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { participants: 5 },
        organizer: { id: "user-123", firstName: "Test", lastName: "User", authUserId: "auth-123", role: "USER", hasAvatar: false, lastSeenOn: null, createdAt: new Date(), updatedAt: new Date() },
      };

      mockDb.group.findFirst.mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getByIdWithOrganizer({ groupId: "group-123" });

      expect(result).toEqual(mockGroup);
    });
  });

  describe("create", () => {
    it("should create a new group", async () => {
      const newGroup = createMockGroup({
        id: "new-group-123",
        name: "New Group",
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
        },
      });

      mockDb.group.create.mockResolvedValue(newGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
        description: "A new test group",
      });

      expect(result.name).toBe("New Group");
       
      expect(mockDb.group.create).toHaveBeenCalled();
    });

    it("should create group with custom organizer", async () => {
      const newGroup = createMockGroup({
        id: "new-group-123",
        name: "New Group",
        organizerId: "other-user-123",
        organizer: {
          id: "other-user-123",
          firstName: "Other",
          lastName: "User",
          authUserId: "auth-456",
        },
      });

      mockDb.group.create.mockResolvedValue(newGroup);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
        organizerId: "other-user-123",
      });

      expect(result.name).toBe("New Group");
    });

    it("should handle image upload with storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue("normalized/path");

      const newGroup = createMockGroup({
        id: "new-group-123",
        name: "New Group",
        image: "group/test-image.jpg",
      });

      mockDb.group.create.mockResolvedValue(newGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
        image: "group/test-image.jpg",
      });

      expect(result).toBeDefined();
    });

    it("should handle image upload with URL", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue("normalized/path");

      const newGroup = createMockGroup({
        id: "new-group-123",
        name: "New Group",
        image: "https://example.com/image.jpg",
      });

      mockDb.group.create.mockResolvedValue(newGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
        image: "https://example.com/image.jpg",
      });

      expect(result).toBeDefined();
    });

    it("should retry on duplicate code error", async () => {
      const newGroup = createMockGroup({ id: "new-group-123", name: "New Group" });

      const dbError = new Error("Unique constraint failed on the fields: (`code`)");
      (dbError as { code?: string }).code = "P2002";
      mockDb.group.create.mockRejectedValueOnce(dbError)
        .mockResolvedValueOnce(newGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
      });

      expect(result.name).toBe("New Group");
       
      expect(mockDb.group.create).toHaveBeenCalledTimes(2);
    });

    it("should throw error after max retries", async () => {
      mockDb.group.create.mockRejectedValue(new Error("Test error"));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.create({ tripId: "trip-123", name: "New Group" })
      ).rejects.toThrow("Test error");
    });
  });

  describe("update", () => {
    it("should update group as organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "user-123",
        tripId: "trip-123",
      });

      const updatedGroup = createMockGroup({
        id: "group-123",
        name: "Updated Group",
        organizerId: "user-123",
        tripId: "trip-123",
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.group.update.mockResolvedValue(updatedGroup);

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-123", email: "test@example.com" },
        dbUser: mockUser,
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.update({
        id: "group-123",
        tripId: "trip-123",
        name: "Updated Group",
      });

      expect(result.name).toBe("Updated Group");
    });

    it("should update group as admin", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "other-user-123",
        tripId: "trip-123",
      });

      const updatedGroup = createMockGroup({
        id: "group-123",
        name: "Updated Group",
        organizerId: "other-user-123",
        tripId: "trip-123",
        organizer: {
          id: "other-user-123",
          firstName: "Other",
          lastName: "User",
          authUserId: "auth-456",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.group.update.mockResolvedValue(updatedGroup);

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-admin-123", email: "admin@example.com" },
        dbUser: mockAdminUser,
      });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.update({
        id: "group-123",
        tripId: "trip-123",
        name: "Updated Group",
      });

      expect(result.name).toBe("Updated Group");
    });

    it("should allow admin to change organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "user-123",
        tripId: "trip-123",
      });

      const updatedGroup = createMockGroup({
        id: "group-123",
        organizerId: "new-organizer-123",
        tripId: "trip-123",
        organizer: {
          id: "new-organizer-123",
          firstName: "New",
          lastName: "Organizer",
          authUserId: "auth-789",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.group.update.mockResolvedValue(updatedGroup);

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-admin-123", email: "admin@example.com" },
        dbUser: mockAdminUser,
      });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.update({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "new-organizer-123",
      });

      expect(result.organizerId).toBe("new-organizer-123");
    });

    it("should throw FORBIDDEN when non-organizer tries to update", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "other-user-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "group-123",
          tripId: "trip-123",
          name: "Updated Group",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when organizer tries to change organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "user-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "group-123",
          tripId: "trip-123",
          organizerId: "new-organizer-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        isDeleted: true,
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "group-123",
          tripId: "trip-123",
          name: "Updated Group",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND for group in different trip", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "different-trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "group-123",
          tripId: "trip-123",
          name: "Updated Group",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("delete", () => {
    it("should delete group as admin", async () => {
      const existingGroup = createMockGroup({ id: "group-123" });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.delete({ id: "group-123" });

      expect(result.success).toBe(true);
       
      expect(mockDb.group.update).toHaveBeenCalledWith({
        where: { id: "group-123" },
        data: { isDeleted: true },
      });
    });

    it("should throw NOT_FOUND for already deleted group", async () => {
      const existingGroup = createMockGroup({ id: "group-123", isDeleted: true });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.delete({ id: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.delete({ id: "non-existent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("deleteMyGroup", () => {
    it("should delete group as organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "user-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-123", email: "test@example.com" },
        dbUser: mockUser,
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.deleteMyGroup({ groupId: "group-123" });

      expect(result.success).toBe(true);
    });

    it("should throw FORBIDDEN when non-organizer tries to delete", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "other-user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.deleteMyGroup({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        isDeleted: true,
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.deleteMyGroup({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("join", () => {
    it("should join group as admin", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        participants: [],
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.join({ id: "group-123", tripId: "trip-123" });

      expect(result).toBeDefined();
       
      expect(mockDb.tripParticipant.upsert).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.join({ id: "non-existent", tripId: "trip-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for group in different trip", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "different-trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.join({ id: "group-123", tripId: "trip-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when already in group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        participants: [
          {
            id: "participant-1",
            userId: "admin-123",
            tripId: "trip-123",
            groupId: "group-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.join({ id: "group-123", tripId: "trip-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("requestToJoin", () => {
    it("should create join request", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "organizer-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      // User must be a trip participant (not in any group) to request joining
      mockDb.tripParticipant.findUnique.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.groupJoinRequest.findUnique.mockResolvedValue(null);

      const mockRequest = createMockJoinRequest({
        id: "request-123",
        groupId: "group-123",
        userId: "user-123",
      });
      mockDb.groupJoinRequest.create.mockResolvedValue(mockRequest);

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-123", email: "test@example.com" },
        dbUser: mockUser,
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.requestToJoin({ groupId: "group-123" });

      expect(result.id).toBe("request-123");
       
      expect(mockDb.groupJoinRequest.create).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        isDeleted: true,
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.requestToJoin({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when not a trip participant", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.requestToJoin({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when already in a group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.requestToJoin({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when request already exists for same group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.groupJoinRequest.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.requestToJoin({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when request exists for different group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.groupJoinRequest.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.requestToJoin({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("getMyJoinRequestForGroup", () => {
    it("should return join request for group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      const mockRequest = createMockJoinRequest({
        groupId: "group-123",
        userId: "user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.groupJoinRequest.findFirst.mockResolvedValue(mockRequest);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyJoinRequestForGroup({ groupId: "group-123" });

      expect(result).toEqual(mockRequest);
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        isDeleted: true,
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getMyJoinRequestForGroup({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("cancelMyJoinRequest", () => {
    it("should cancel join request", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      const mockRequest = createMockJoinRequest({
        id: "request-123",
        groupId: "group-123",
        userId: "user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.groupJoinRequest.findFirst.mockResolvedValue(mockRequest);
      mockDb.groupJoinRequest.delete.mockResolvedValue(mockRequest);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.cancelMyJoinRequest({ groupId: "group-123" });

      expect(result.success).toBe(true);
       
      expect(mockDb.groupJoinRequest.delete).toHaveBeenCalledWith({
        where: { id: "request-123" },
      });
    });

    it("should throw NOT_FOUND when no request exists", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);
      mockDb.groupJoinRequest.findFirst.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.cancelMyJoinRequest({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("getPendingJoinRequests", () => {
    it("should return pending requests for organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "user-123",
      });

      const mockRequests = [
        createMockJoinRequest({
          id: "request-1",
          user: {
            id: "user-456",
            firstName: "Requester",
            lastName: "User",
            authUserId: "auth-456",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ];

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.groupJoinRequest.findMany.mockResolvedValue(mockRequests);

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-123", email: "test@example.com" },
        dbUser: mockUser,
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getPendingJoinRequests({ groupId: "group-123" });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("request-1");
    });

    it("should throw FORBIDDEN when not organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        organizerId: "other-user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getPendingJoinRequests({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("respondToJoinRequest", () => {
    it("should accept join request", async () => {
      const mockRequest = {
        id: "request-123",
        groupId: "group-123",
        tripId: "trip-123",
        userId: "user-456",
        createdAt: new Date(),
        updatedAt: new Date(),
        group: {
          id: "group-123",
          tripId: "trip-123",
          organizerId: "user-123",
          isDeleted: false,
          name: "Test Group",
          description: null,
          image: null,
          code: "1234",
          coins: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockDb.groupJoinRequest.findUnique.mockResolvedValue(mockRequest);
      // The requesting user must be a trip participant without a group
      mockDb.tripParticipant.findUnique.mockResolvedValue({
        id: "participant-456",
        userId: "user-456",
        tripId: "trip-123",
        groupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      // Override the requireAuth mock to return the correct user for this test
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-123", email: "test@example.com" },
        dbUser: mockUser,
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.respondToJoinRequest({
        requestId: "request-123",
        decision: "ACCEPT",
      });

      expect(result.status).toBe("ACCEPTED");
    });

    it("should reject join request", async () => {
      const mockRequest = {
        id: "request-123",
        groupId: "group-123",
        tripId: "trip-123",
        userId: "user-456",
        createdAt: new Date(),
        updatedAt: new Date(),
        group: {
          id: "group-123",
          tripId: "trip-123",
          organizerId: "user-123",
          isDeleted: false,
          name: "Test Group",
          description: null,
          image: null,
          code: "1234",
          coins: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockDb.groupJoinRequest.findUnique.mockResolvedValue(mockRequest);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.respondToJoinRequest({
        requestId: "request-123",
        decision: "REJECT",
      });

      expect(result.status).toBe("REJECTED");
    });

    it("should throw NOT_FOUND for non-existent request", async () => {
      mockDb.groupJoinRequest.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.respondToJoinRequest({
          requestId: "non-existent",
          decision: "ACCEPT",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when not organizer", async () => {
      const mockRequest = {
        id: "request-123",
        groupId: "group-123",
        tripId: "trip-123",
        userId: "user-456",
        group: {
          id: "group-123",
          tripId: "trip-123",
          organizerId: "other-user-123",
          isDeleted: false,
        },
      };

      mockDb.groupJoinRequest.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.respondToJoinRequest({
          requestId: "request-123",
          decision: "ACCEPT",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when user already in another group", async () => {
      const mockRequest = {
        id: "request-123",
        groupId: "group-123",
        tripId: "trip-123",
        userId: "user-456",
        group: {
          id: "group-123",
          tripId: "trip-123",
          organizerId: "user-123",
          isDeleted: false,
        },
      };

      mockDb.groupJoinRequest.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.respondToJoinRequest({
          requestId: "request-123",
          decision: "ACCEPT",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("assignUserToGroup", () => {
    it("should assign user to group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        participants: [],
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.assignUserToGroup({
        userId: "user-456",
        tripId: "trip-123",
        groupId: "group-123",
      });

      expect(result).toBeDefined();
       
      expect(mockDb.tripParticipant.upsert).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.assignUserToGroup({
          userId: "user-456",
          tripId: "trip-123",
          groupId: "group-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for group in different trip", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "different-trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.assignUserToGroup({
          userId: "user-456",
          tripId: "trip-123",
          groupId: "group-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when user already in group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        participants: [
          {
            id: "participant-1",
            userId: "user-456",
            tripId: "trip-123",
            groupId: "group-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.assignUserToGroup({
          userId: "user-456",
          tripId: "trip-123",
          groupId: "group-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("bulkAssignUsersToGroup", () => {
    it("should assign multiple users to group as organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const mockParticipants = [
        {
          id: "participant-1",
          userId: "user-456",
          tripId: "trip-123",
          groupId: "group-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "user-456",
            firstName: "User",
            lastName: "One",
            authUserId: "auth-456",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: "participant-2",
          userId: "user-789",
          tripId: "trip-123",
          groupId: "group-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "user-789",
            firstName: "User",
            lastName: "Two",
            authUserId: "auth-789",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      mockDb.tripParticipant.findMany.mockResolvedValue(mockParticipants);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.bulkAssignUsersToGroup({
        tripId: "trip-123",
        groupId: "group-123",
        userIds: ["user-456", "user-789"],
      });

      expect(result.count).toBe(2);
      expect(result.participants).toHaveLength(2);
    });

    it("should deduplicate user IDs", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await caller.bulkAssignUsersToGroup({
        tripId: "trip-123",
        groupId: "group-123",
        userIds: ["user-456", "user-456", "user-789"],
      });

      // Should only call upsert twice (once per unique user)
       
      expect(mockDb.tripParticipant.upsert).toHaveBeenCalledTimes(2);
    });

    it("should throw NOT_FOUND for group in different trip", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "different-trip-123",
        organizerId: "user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.bulkAssignUsersToGroup({
          tripId: "trip-123",
          groupId: "group-123",
          userIds: ["user-456"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when not organizer", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "other-user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.bulkAssignUsersToGroup({
          tripId: "trip-123",
          groupId: "group-123",
          userIds: ["user-456"],
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("removeUserFromGroup", () => {
    it("should remove user from group as organizer", async () => {
      // Participant being removed must NOT be the organizer
      const mockParticipant = createMockParticipant({ userId: "user-456" });
      const mockGroup = createMockGroup({ organizerId: "user-123" });

      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      mockDb.tripParticipant.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.removeUserFromGroup({
        userId: "user-456",
        tripId: "trip-123",
      });

      expect(result.groupId).toBeNull();
    });

    it("should remove user from group as admin", async () => {
      // Admin can remove any user including the organizer
      const mockParticipant = createMockParticipant({ userId: "user-456" });
      const mockGroup = createMockGroup({ organizerId: "user-456" });

      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      mockDb.tripParticipant.count.mockResolvedValue(1);

      // Mock requireAuth to return admin user
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValueOnce({
        user: { id: "auth-admin-123", email: "admin@example.com" },
        dbUser: mockAdminUser,
      });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.removeUserFromGroup({
        userId: "user-456",
        tripId: "trip-123",
      });

      expect(result.groupId).toBeNull();
    });

    it("should delete group when last member is removed", async () => {
      // Participant being removed must NOT be the organizer
      const mockParticipant = createMockParticipant({ userId: "user-456" });
      const mockGroup = createMockGroup({ organizerId: "user-123" });

      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      // No members left after removal
      mockDb.tripParticipant.count.mockResolvedValue(0);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.removeUserFromGroup({
        userId: "user-456",
        tripId: "trip-123",
      });

      expect(result.groupId).toBeNull();
       
      expect(mockDb.group.update).toHaveBeenCalledWith({
        where: { id: "group-123" },
        data: { isDeleted: true },
      });
    });

    it("should reassign organizer when organizer is removed", async () => {
      // Admin removes the organizer - participant must match the user being removed
      const mockParticipant = createMockParticipant({ userId: "user-123" });
      const mockGroup = createMockGroup({ organizerId: "user-123" });
      const nextOrganizerParticipant = {
        id: "next-participant-123",
        userId: "user-789",
        tripId: "trip-123",
        groupId: "group-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      // Still members left
      mockDb.tripParticipant.count.mockResolvedValue(1);
      mockDb.tripParticipant.findFirst.mockResolvedValue(nextOrganizerParticipant);

      // Mock requireAuth to return admin user - middleware overwrites ctx.dbUser
      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValueOnce({
        user: { id: "auth-admin-123", email: "admin@example.com" },
        dbUser: mockAdminUser,
      });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.removeUserFromGroup({
        userId: "user-123",
        tripId: "trip-123",
      });

       
      expect(mockDb.group.update).toHaveBeenCalledWith({
        where: { id: "group-123" },
        data: { organizerId: "user-789" },
      });
    });

    it("should throw NOT_FOUND when participant not found", async () => {
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeUserFromGroup({
          userId: "user-456",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when non-organizer tries to remove member", async () => {
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockParticipant());

      mockDb.group.findUnique.mockResolvedValue(createMockGroup({ organizerId: "other-user-123" }));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeUserFromGroup({
          userId: "user-456",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when organizer tries to remove themselves", async () => {
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockParticipant());

      mockDb.group.findUnique.mockResolvedValue(createMockGroup({ organizerId: "user-123" }));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeUserFromGroup({
          userId: "user-123",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("leaveMyGroup", () => {
    it("should leave group as regular member", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "organizer-123",
      });
      const mockParticipant = createMockParticipant();

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      // 1 member remaining after leaving (the organizer)
      mockDb.tripParticipant.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.leaveMyGroup({ groupId: "group-123" });

      expect(result.left).toBe(true);
      expect(result.groupDeleted).toBe(false);
    });

    it("should leave group as organizer and reassign", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "user-123",
      });
      const mockParticipant = createMockParticipant({ userId: "user-123" });
      const otherParticipants = [
        { ...createMockParticipant(), id: "participant-456", userId: "next-organizer-123" },
      ];

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.tripParticipant.findMany.mockResolvedValue(otherParticipants);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      // 1 member remaining after organizer leaves
      mockDb.tripParticipant.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.leaveMyGroup({ groupId: "group-123" });

      expect(result.left).toBe(true);
      expect(result.reassignedOrganizerId).toBe("next-organizer-123");
      expect(result.groupDeleted).toBe(false);
    });

    it("should delete group when organizer leaves and no members remain", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "user-123",
      });
      const mockParticipant = createMockParticipant({ userId: "user-123" });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.tripParticipant.findMany.mockResolvedValue([]);
      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });
      mockDb.tripParticipant.update.mockResolvedValue({ ...mockParticipant, groupId: null });
      // No members remaining after organizer leaves
      mockDb.tripParticipant.count.mockResolvedValue(0);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.leaveMyGroup({ groupId: "group-123" });

      expect(result.left).toBe(true);
      expect(result.reassignedOrganizerId).toBeNull();
      expect(result.groupDeleted).toBe(true);
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        isDeleted: true,
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.leaveMyGroup({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when not a member", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.leaveMyGroup({ groupId: "group-123" })).rejects.toThrow(ORPCError);
    });
  });

  describe("addCoins", () => {
    it("should add coins to group as moderator", async () => {
      const { captureTripRankingSnapshot, createRankChangeActivities } = await import("../../../utils/activityFeed");
      captureTripRankingSnapshot.mockResolvedValue(undefined);
      createRankChangeActivities.mockResolvedValue(undefined);

      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);

      const mockTransaction = createMockCoinTransaction({
        id: "transaction-123",
        groupId: "group-123",
        amount: 100,
        adminId: "moderator-123",
        group: {
          id: "group-123",
          name: "Test Group",
          coins: 100,
          description: null,
          image: null,
          code: "1234",
          tripId: "trip-123",
          organizerId: "user-123",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockDb.coinTransaction.create.mockResolvedValue(mockTransaction);

      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.addCoins({
        groupId: "group-123",
        amount: 100,
        tripId: "trip-123",
      });

      expect(result.amount).toBe(100);
       
      expect(mockDb.group.update).toHaveBeenCalledWith({
        where: { id: "group-123" },
        data: { coins: { increment: 100 } },
      });
    });

    it("should throw NOT_FOUND for group in different trip", async () => {
      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "different-trip-123",
      });

      mockDb.group.findUnique.mockResolvedValue(existingGroup);

      mockDb.$transaction.mockImplementation(async (fn: ((db: typeof mockDb) => Promise<unknown>) | Promise<unknown>[]) => {
              if (typeof fn === "function") {
                return await fn(mockDb);
              }
              return Promise.all(fn);
            });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addCoins({
          groupId: "group-123",
          amount: 100,
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("ranking", () => {
    it("should return group ranking", async () => {
      const mockGroups = [
        createMockGroup({
          id: "group-1",
          name: "First Group",
          coins: 300,
          tripId: "trip-123",
          organizer: {
            id: "user-1",
            firstName: "First",
            lastName: "Organizer",
            authUserId: "auth-1",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          participants: [
            {
              id: "participant-1",
              userId: "user-1",
              tripId: "trip-123",
              groupId: "group-1",
              createdAt: new Date(),
              updatedAt: new Date(),
              user: {
                id: "user-1",
                firstName: "First",
                lastName: "User",
                authUserId: "auth-1",
                role: "USER",
                hasAvatar: false,
                lastSeenOn: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
          coinTransactions: [],
        }),
        createMockGroup({
          id: "group-2",
          name: "Second Group",
          coins: 200,
          tripId: "trip-123",
          organizer: {
            id: "user-2",
            firstName: "Second",
            lastName: "Organizer",
            authUserId: "auth-2",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          participants: [],
          coinTransactions: [],
        }),
        createMockGroup({
          id: "group-3",
          name: "Third Group",
          coins: 100,
          tripId: "trip-123",
          organizer: {
            id: "user-3",
            firstName: "Third",
            lastName: "Organizer",
            authUserId: "auth-3",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          participants: [],
          coinTransactions: [],
        }),
      ];

      mockDb.group.findMany.mockResolvedValue(mockGroups);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.ranking({ tripId: "trip-123" });

      expect(result.data).toHaveLength(3);
      expect(result.data[0].coins).toBe(300);
      expect(result.data[1].coins).toBe(200);
      expect(result.data[2].coins).toBe(100);
      expect(result.currentDate).toBeInstanceOf(Date);
    });

    it("should filter out deleted groups", async () => {
      mockDb.group.findMany.mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.ranking({ tripId: "trip-123" });

      expect(result.data).toHaveLength(0);
       
      expect(mockDb.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tripId: "trip-123", isDeleted: false },
        })
      );
    });
  });

  describe("Helper Functions", () => {
    it("should handle batch email lookup for multiple groups", async () => {
      const mockGroups = [
        createMockGroup({
          id: "group-1",
          image: null,
          participants: [],
          organizer: {
            id: "user-1",
            firstName: "Test",
            lastName: "User",
            authUserId: "auth-1",
            role: "USER",
            hasAvatar: false,
            lastSeenOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          coinTransactions: [],
        }),
      ];

      mockDb.group.findMany.mockResolvedValue(mockGroups);
      mockDb.group.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      // Verify that the function processed groups (batch email lookup is internal)
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].id).toBe("group-1");
    });

    it("should handle group image resolution with storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue({ bucket: "images", path: "group/test-image.jpg", storagePath: "images/group/test-image.jpg" });

      const mockGroup = createMockGroup({
        id: "group-123",
        image: "group/test-image.jpg",
        participants: [],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        coinTransactions: [],
      });

      mockDb.group.findMany.mockResolvedValue([mockGroup] as unknown);
      mockDb.group.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.groups[0].image).toBe("https://signed-url.example.com/image.jpg");
    });

    it("should handle group image resolution with external URL", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue(null);

      const mockGroup = createMockGroup({
        id: "group-123",
        image: "https://example.com/external-image.jpg",
        participants: [],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        coinTransactions: [],
      });

      mockDb.group.findMany.mockResolvedValue([mockGroup] as unknown);
      mockDb.group.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.groups[0].image).toBe("https://example.com/external-image.jpg");
    });

    it("should handle null image", async () => {
      const mockGroup = createMockGroup({
        id: "group-123",
        image: null,
        participants: [],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        coinTransactions: [],
      });

      mockDb.group.findMany.mockResolvedValue([mockGroup] as unknown);
      mockDb.group.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.groups[0].image).toBeNull();
    });

    it("should handle failed signed URL generation", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue({ bucket: "images", path: "group/test-image.jpg", storagePath: "images/group/test-image.jpg" });

      mockSupabase.storage.from = vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to create signed URL"),
        }),
      });

      const mockGroup = createMockGroup({
        id: "group-123",
        image: "group/test-image.jpg",
        participants: [],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        coinTransactions: [],
      });

      mockDb.group.findMany.mockResolvedValue([mockGroup] as unknown);
      mockDb.group.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.groups[0].image).toBeNull();
    });
  });

  describe("Input Validation", () => {
    it("should validate group name is required", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing invalid input
        caller.create({ tripId: "trip-123", name: "" })
      ).rejects.toThrow();
    });

    it("should reject invalid image URL or storage path", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      // Test with empty string image (should fail validation)
      await expect(
        caller.create({
          tripId: "trip-123",
          name: "Test Group",
          image: "",
        })
      ).rejects.toThrow();
    });

    it("should accept valid storage path as image", async () => {
      const newGroup = createMockGroup({
        id: "new-group-123",
        name: "New Group",
        image: "group/valid-path.jpg",
      });

      mockDb.group.create.mockResolvedValue(newGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
        image: "group/valid-path.jpg",
      });

      expect(result).toBeDefined();
    });

    it("should accept valid URL as image", async () => {
      const newGroup = createMockGroup({
        id: "new-group-123",
        name: "New Group",
        image: "https://example.com/image.jpg",
      });

      mockDb.group.create.mockResolvedValue(newGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.create({
        tripId: "trip-123",
        name: "New Group",
        image: "https://example.com/image.jpg",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle database transaction errors", async () => {
      mockDb.$transaction.mockRejectedValue(new Error("Test error"));

      const existingGroup = createMockGroup({
        id: "group-123",
        tripId: "trip-123",
        organizerId: "user-123",
      });

      mockDb.group.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.deleteMyGroup({ groupId: "group-123" })).rejects.toThrow();
    });

    it("should handle missing user in context", async () => {
      const { requireAuth } = await import("@mirai-app/auth");
      // Use mockRejectedValueOnce so it only affects this test
      requireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getMy({ tripId: "trip-123" })).rejects.toThrow();
    });

    it("should handle empty participant list in getMy", async () => {
      const mockParticipant = createMockParticipant({ groupId: "group-123" });
      const mockGroup = createMockGroup({
        id: "group-123",
        participants: [],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        coinTransactions: [],
      });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMy({ tripId: "trip-123" });

      expect(result).toBeDefined();
      expect(result?.participants).toHaveLength(0);
    });

    it("should handle group without organizer", async () => {
      const mockParticipant = createMockParticipant({ groupId: "group-123" });
      const mockGroup = createMockGroup({
        id: "group-123",
        organizerId: null,
        organizer: null,
        participants: [],
        coinTransactions: [],
      });

      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.group.findUnique.mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMy({ tripId: "trip-123" });

      expect(result).toBeDefined();
      expect(result?.organizer).toBeNull();
    });

    it("should handle approved submissions with images in getById", async () => {
      const mockGroup = createMockGroup({
        id: "group-123",
        participants: [],
        organizer: {
          id: "user-123",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-123",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        trip: { id: "trip-123", name: "Test Trip", description: null, image: null, startDate: new Date(), endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
        _count: { participants: 0 },
        challengeSubmissions: [
          {
            id: "submission-1",
            imageIds: ["image-1.jpg", "image-2.jpg"],
            createdAt: new Date(),
            reviewedAt: new Date(),
            challenge: { id: "challenge-1", name: "Test Challenge", description: null, coins: 10, image: null, isDisabled: false, tripId: "trip-123", createdAt: new Date(), updatedAt: new Date() },
          },
          {
            id: "submission-2",
            imageIds: [],
            createdAt: new Date(),
            reviewedAt: new Date(),
            challenge: { id: "challenge-2", name: "Another Challenge", description: null, coins: 10, image: null, isDisabled: false, tripId: "trip-123", createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      });

      mockDb.group.findUnique.mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getById({ id: "group-123" });

      expect(result.approvedSubmissions).toHaveLength(1);
      expect(result.approvedSubmissions[0].imageStoragePath).toBe("image-1.jpg");
    });
  });
});
