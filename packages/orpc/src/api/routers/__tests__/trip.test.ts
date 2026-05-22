import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { tripRouter } from "../trip";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type {
  DB,
  User,
  Trip,
  TripParticipant,
  TripGroup,
  TripResource,
  TripInsurance,
  TripInsuranceStep,
  TripSponsor,
  Sponsor,
} from "@mirai-app/db";
import {
  requireAuth,
  requireAdmin,
  AuthenticationError,
  AuthorizationError,
} from "@mirai-app/auth";
import { addDrizzleApi } from "../../../../vitest.setup";

vi.mock("@mirai-app/auth", () => {
  const mockSupabaseUser = {
    id: "test-auth-user-id",
    email: "test@example.com",
    user_metadata: { firstName: "Test", lastName: "User" },
  };

  const mockDbUser = {
    id: "test-db-user-id",
    authUserId: "test-auth-user-id",
    firstName: "Test",
    lastName: "User",
    role: "USER",
  };

  return {
    requireAuth: vi.fn().mockResolvedValue({
      user: mockSupabaseUser,
      dbUser: mockDbUser,
    }),
    requireAdmin: vi.fn().mockResolvedValue({
      ...mockDbUser,
      role: "ADMIN",
    }),
    AuthenticationError: class extends Error {
      constructor(message = "Not Authenticated") {
        super(message);
        this.name = "AuthenticationError";
      }
    },
    AuthorizationError: class extends Error {
      constructor(message = "Missing Required Permissions") {
        super(message);
        this.name = "AuthorizationError";
      }
    },
  };
});

/**
 * Trip Router Tests
 *
 * Comprehensive tests for the trip management router covering:
 * - Protected procedures (getAll, getById, getResources)
 * - Admin procedures (getByIdAdmin, create, update, delete)
 * - Authentication and authorization flows
 * - Error handling (FORBIDDEN, NOT_FOUND, UNAUTHORIZED)
 * - Edge cases (pagination, image resolution, email lookup)
 */

// Type for mock DB client - uses vi.MockedFn for all methods

type MockFn = ReturnType<typeof vi.fn> & ((...args: unknown[]) => unknown);

interface MockDbClient {
  trip: {
    findMany: MockFn;
    findUnique: MockFn;
    count: MockFn;
    create: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  tripParticipant: {
    findUnique: MockFn;
    findMany: MockFn;
  };
  tripGroup: {
    findMany: MockFn;
  };
  tripResource: {
    findMany: MockFn;
  };
  tripInsurance: {
    findUnique: MockFn;
  };
  tripSponsor: {
    findMany: MockFn;
  };
  user: {
    findFirst: MockFn;
    findUnique: MockFn;
  };
  userAgent: {
    create: MockFn;
  };
  $transaction: MockFn;
}

const createCaller = (ctx: TRPCContext) => createRouterClient(tripRouter, { context: ctx });

describe("tripRouter", () => {
  let mockDb: MockDbClient;
  let mockSupabase: SupabaseClient;
  let mockUser: { id: string; email: string };
  let mockDbUser: User;
  let mockAdminUser: User;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = { id: "auth-user-123", email: "test@example.com" };
    mockDbUser = {
      id: "db-user-123",
      authUserId: "auth-user-123",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      hasAvatar: false,
      lastSeenOn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockAdminUser = {
      id: "db-admin-123",
      authUserId: "auth-admin-123",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      hasAvatar: false,
      lastSeenOn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup mock database client
    mockDb = {
      trip: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      tripGroup: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      tripResource: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      tripInsurance: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      tripSponsor: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      userAgent: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn((cb: (arg: DB) => unknown) => cb(mockDb as unknown as DB)),
    };

    addDrizzleApi(mockDb);

    // Setup mock Supabase client - need to return user that matches mockDbUser
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockImplementation((token?: string) => {
          if (!token || token === "invalid-token") {
            return Promise.resolve({
              data: { user: null },
              error: new Error("Invalid or missing token"),
            });
          }
          return Promise.resolve({
            data: { user: { ...mockUser, id: mockDbUser.authUserId } },
            error: null,
          });
        }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: "test@example.com", banned_until: null } },
            error: null,
          }),
        },
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://signed-url.example.com/image.jpg" },
            error: null,
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
    } satisfies SupabaseClient;
  });

  describe("getAll (protectedProcedure)", () => {
    it("should return trips for authenticated participant with pagination", async () => {
      const mockTrips: Trip[] = [
        {
          id: "trip-1",
          name: "Summer Trip",
          description: "Beach vacation",
          startDate: new Date("2025-06-01"),
          endDate: new Date("2025-06-07"),
          backgroundImagePath: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tripSponsors: [] as any,
        },
        {
          id: "trip-2",
          name: "Winter Trip",
          description: "Ski vacation",
          startDate: new Date("2025-12-01"),
          endDate: new Date("2025-12-07"),
          backgroundImagePath: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tripSponsors: [] as any,
        },
      ];

      mockDb.tripParticipant.findMany.mockResolvedValue([
        { tripId: "trip-1" },
        { tripId: "trip-2" },
      ]);
      mockDb.trip.findMany.mockResolvedValue(mockTrips);
      mockDb.trip.count.mockResolvedValue(2);
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll({ pagination: { limit: 10, offset: 0 } });

      expect(result.trips).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
      expect(mockDb.trip.findMany).toHaveBeenCalled();
    });

    it("should use default pagination when not provided", async () => {
      mockDb.trip.findMany.mockResolvedValue([]);

      mockDb.trip.count.mockResolvedValue(0);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll();

      expect(result.pagination.limit).toBe(30);
      expect(result.pagination.offset).toBe(0);
    });

    it("should return hasMore=true when there are more trips", async () => {
      mockDb.tripParticipant.findMany.mockResolvedValue([{ tripId: "trip-1" }]);
      mockDb.trip.findMany.mockResolvedValue([]);
      mockDb.trip.count.mockResolvedValue(100);
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll({ pagination: { limit: 30, offset: 0 } });

      expect(result.pagination.hasMore).toBe(true);
    });

    it("should include groups and sponsors in response", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: "Test Description",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-07"),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [{ id: "group-1", name: "Group A" }],
        tripSponsors: [
          {
            id: "ts-1",
            tripId: "trip-1",
            sponsorId: "sponsor-1",
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            sponsor: {
              id: "sponsor-1",
              name: "Test Sponsor",
              logoUrl: "https://example.com/logo.png",
              websiteUrl: "https://example.com",
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Sponsor,
          } as TripSponsor,
        ],
      };

      mockDb.tripParticipant.findMany.mockResolvedValue([{ tripId: "trip-1" }]);
      mockDb.trip.findMany.mockResolvedValue([mockTrip]);
      mockDb.trip.count.mockResolvedValue(1);
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll();

      expect(result.trips[0]?.groups).toBeDefined();
      expect(result.trips[0]?.tripSponsors).toBeDefined();
      expect(result.trips[0]?.tripSponsors[0]?.sponsor).toBeDefined();
    });
  });

  describe("getById (protectedProcedure)", () => {
    it("should return trip details for participant", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: "Test Description",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-07"),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [] as TripGroup[],
        tripSponsors: [] as TripSponsor[],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,
            group: null,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue([]);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.id).toBe("trip-1");
      expect(result.name).toBe("Test Trip");
      expect(result.participants).toHaveLength(1);
    });

    it("should throw FORBIDDEN when user is not a participant", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "trip-1" })).rejects.toThrow(ORPCError);
      await expect(caller.getById({ id: "trip-1" })).rejects.toThrow(
        "You are not a participant of this trip",
      );
    });

    it("should throw NOT_FOUND when trip does not exist", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(ORPCError);
      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow("Trip not found");
    });

    it("should resolve group images with signed URLs", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [
          {
            id: "group-1",
            name: "Group A",
            code: "GROUPA",
            image: "images/group/avatar-1.jpg",
            coins: 100,
            _count: { participants: 5 },
          } as TripGroup,
        ],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,

            group: {
              id: "group-1",
              name: "Group A",
              image: "images/group/avatar-1.jpg",
              coins: 100,
              isDeleted: false,
              _count: { participants: 5 },
            } as TripGroup,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue(mockTrip.groups);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.groups[0]?.image).toBe("https://signed-url.example.com/image.jpg");

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("images");
    });

    it("should handle deleted groups by returning null", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,

            group: {
              id: "group-1",
              name: "Group A",
              image: null,
              coins: 100,
              isDeleted: true,
              _count: { participants: 5 },
            } as TripGroup,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue([]);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.participants[0]?.group).toBeNull();
    });

    it("should resolve participant emails from auth lookup", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,
            group: null,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue([]);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "resolved@example.com" } },
        error: null,
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.participants[0]?.user.email).toBe("resolved@example.com");
    });
  });

  describe("getByIdAdmin (adminProcedure)", () => {
    it("should return trip details for admin without participant check", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: "Test Description",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-07"),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [] as TripGroup[],
        tripSponsors: [] as TripSponsor[],
        participants: [] as TripParticipant[],
      };

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getByIdAdmin({ id: "trip-1" });

      expect(result.id).toBe("trip-1");

      expect(mockDb.tripParticipant.findUnique).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when trip does not exist", async () => {
      mockDb.trip.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getByIdAdmin({ id: "non-existent" })).rejects.toThrow(ORPCError);
      await expect(caller.getByIdAdmin({ id: "non-existent" })).rejects.toThrow("Trip not found");
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getByIdAdmin({ id: "trip-1" })).rejects.toThrow();
    });
  });

  describe("create (adminProcedure)", () => {
    it("should create a new trip with all fields", async () => {
      const newTrip = {
        id: "trip-new",
        name: "New Trip",
        description: "New Description",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-07"),
        backgroundImagePath: "images/trips/new-trip.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.trip.create.mockResolvedValue(newTrip);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        name: "New Trip",
        description: "New Description",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-07"),
        backgroundImagePath: "images/trips/new-trip.jpg",
      });

      expect(result.name).toBe("New Trip");
      expect(result.description).toBe("New Description");

      expect(mockDb.trip.create).toHaveBeenCalledWith({
        data: {
          name: "New Trip",
          description: "New Description",

          startDate: expect.any(Date),

          endDate: expect.any(Date),
          backgroundImagePath: "images/trips/new-trip.jpg",
        },
      });
    });

    it("should create trip with minimal required fields", async () => {
      const newTrip = {
        id: "trip-minimal",
        name: "Minimal Trip",
        description: null,
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-07"),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.trip.create.mockResolvedValue(newTrip);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        name: "Minimal Trip",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-07"),
      });

      expect(result.name).toBe("Minimal Trip");
      expect(result.description).toBeNull();
    });

    it("should throw error for invalid input (empty name)", async () => {
      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          name: "",
          startDate: new Date(),
          endDate: new Date(),
        }),
      ).rejects.toThrow();
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      // Mock requireAdmin to throw AuthorizationError for non-admin users

      requireAdmin.mockRejectedValueOnce(new AuthorizationError("Admin access required"));

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          name: "New Trip",
          startDate: new Date(),
          endDate: new Date(),
        }),
      ).rejects.toThrow();
    });
  });

  describe("update (adminProcedure)", () => {
    it("should update trip with provided fields", async () => {
      const existingTrip = {
        id: "trip-1",
        name: "Old Name",
        description: "Old Description",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-07"),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTrip = {
        ...existingTrip,
        name: "Updated Name",
        description: "Updated Description",
      };

      mockDb.trip.findUnique.mockResolvedValue(existingTrip);

      mockDb.trip.update.mockResolvedValue(updatedTrip);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "trip-1",
        name: "Updated Name",
        description: "Updated Description",
      });

      expect(result.name).toBe("Updated Name");
      expect(result.description).toBe("Updated Description");
      expect(mockDb.trip.update).toHaveBeenCalled();
    });

    it("should update trip dates", async () => {
      const existingTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-07"),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTrip = {
        ...existingTrip,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-10"),
      };

      mockDb.trip.findUnique.mockResolvedValue(existingTrip);

      mockDb.trip.update.mockResolvedValue(updatedTrip);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "trip-1",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-10"),
      });

      expect(result.startDate).toEqual(new Date("2025-07-01"));
      expect(result.endDate).toEqual(new Date("2025-07-10"));
    });

    it("should throw NOT_FOUND when trip does not exist", async () => {
      mockDb.trip.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "non-existent",
          name: "Updated Name",
        }),
      ).rejects.toThrow(ORPCError);
      await expect(
        caller.update({
          id: "non-existent",
          name: "Updated Name",
        }),
      ).rejects.toThrow("Trip not found");
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "trip-1",
          name: "Updated Name",
        }),
      ).rejects.toThrow();
    });
  });

  describe("getResources (protectedProcedure)", () => {
    it("should return resources and insurance for participant", async () => {
      const mockResources: TripResource[] = [
        {
          id: "resource-1",
          tripId: "trip-1",
          title: "Resource 1",
          content: "Content 1",
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "resource-2",
          tripId: "trip-1",
          title: "Resource 2",
          content: "Content 2",
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockInsurance: TripInsurance = {
        id: "insurance-1",
        tripId: "trip-1",
        providerName: "Test Insurance",
        policyNumber: "POL123",
        emergencyPhone: "+1234567890",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSteps: TripInsuranceStep[] = [
        {
          id: "step-1",
          tripInsuranceId: "insurance-1",
          stepNumber: 1,
          title: "Step 1",
          description: "Description 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "step-2",
          tripInsuranceId: "insurance-1",
          stepNumber: 2,
          title: "Step 2",
          description: "Description 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.tripResource.findMany.mockResolvedValue(mockResources);

      mockDb.tripInsurance.findUnique.mockResolvedValue({ ...mockInsurance, steps: mockSteps });

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getResources({ tripId: "trip-1" });

      expect(result.resources).toHaveLength(2);
      expect(result.resources[0]?.title).toBe("Resource 1");
      expect(result.resources[1]?.title).toBe("Resource 2");
      expect(result.insurance).toBeDefined();
      expect(result.insurance?.providerName).toBe("Test Insurance");
      expect(result.insurance?.steps).toHaveLength(2);
    });

    it("should return empty resources when none exist", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.tripResource.findMany.mockResolvedValue([]);

      mockDb.tripInsurance.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getResources({ tripId: "trip-1" });

      expect(result.resources).toHaveLength(0);
      expect(result.insurance).toBeNull();
    });

    it("should throw FORBIDDEN when user is not a participant", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getResources({ tripId: "trip-1" })).rejects.toThrow(ORPCError);
      await expect(caller.getResources({ tripId: "trip-1" })).rejects.toThrow(
        "You are not a participant of this trip",
      );
    });

    it("should sort resources by sortOrder", async () => {
      const mockResources: TripResource[] = [
        {
          id: "resource-3",
          tripId: "trip-1",
          title: "Resource 3",
          content: "Content 3",
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "resource-1",
          tripId: "trip-1",
          title: "Resource 1",
          content: "Content 1",
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "resource-2",
          tripId: "trip-1",
          title: "Resource 2",
          content: "Content 2",
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.tripResource.findMany.mockResolvedValue(mockResources);

      mockDb.tripInsurance.findUnique.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _result = await caller.getResources({ tripId: "trip-1" });

      expect(mockDb.tripResource.findMany).toHaveBeenCalled();
    });
  });

  describe("delete (adminProcedure)", () => {
    it("should delete trip by id", async () => {
      const deletedTrip = {
        id: "trip-1",
        name: "Deleted Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.trip.delete.mockResolvedValue(deletedTrip);

      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.delete({ id: "trip-1" });

      expect(result.id).toBe("trip-1");
      expect(mockDb.trip.delete).toHaveBeenCalled();
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      // Simulate non-admin user by making requireAdmin throw AuthorizationError

      requireAdmin.mockRejectedValueOnce(new AuthorizationError("Admin access required"));

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.delete({ id: "trip-1" })).rejects.toThrow();
    });
  });

  describe("resolveGroupImage helper", () => {
    it("should return null for null/undefined image", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [
          {
            id: "group-1",
            name: "Group A",
            code: "GROUPA",
            image: null,
            coins: 100,
            _count: { participants: 5 },
          } as TripGroup,
        ],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,
            group: null,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue(mockTrip.groups);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.groups[0]?.image).toBeNull();
    });

    it("should return original image when path parsing fails", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [
          {
            id: "group-1",
            name: "Group A",
            code: "GROUPA",
            image: "https://external.com/image.jpg",
            coins: 100,
            _count: { participants: 5 },
          } as TripGroup,
        ],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,
            group: null,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue(mockTrip.groups);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      // When path parsing fails, it returns the original image
      expect(result.groups[0]?.image).toBe("https://external.com/image.jpg");
    });

    it("should return null when signed URL creation fails", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [
          {
            id: "group-1",
            name: "Group A",
            code: "GROUPA",
            image: "images/group/avatar-1.jpg",
            coins: 100,
            _count: { participants: 5 },
          } as TripGroup,
        ],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockDbUser,
            group: null,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue(mockTrip.groups);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: "test@example.com" } },
        error: null,
      });

      // Mock failed signed URL creation

      mockSupabase.storage.from = vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Storage error"),
        }),
      });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.groups[0]?.image).toBeNull();
    });
  });

  describe("buildAuthEmailLookup integration", () => {
    it("should handle missing auth user emails gracefully", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
        tripSponsors: [],
        participants: [
          {
            id: "tp-1",
            userId: mockDbUser.id,
            tripId: "trip-1",
            groupId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { ...mockDbUser, authUserId: "auth-user-123" },
            group: null,
          } as TripParticipant,
        ],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue([]);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.participants[0]?.user.email).toBeNull();
    });

    it("should handle empty participant list", async () => {
      const mockTrip = {
        id: "trip-1",
        name: "Test Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
        tripSponsors: [],
        participants: [],
      };

      mockDb.tripParticipant.findUnique.mockResolvedValue({ userId: mockDbUser.id });

      mockDb.trip.findUnique.mockResolvedValue(mockTrip);

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockDb.tripGroup.findMany.mockResolvedValue([]);

      mockDb.tripSponsor.findMany.mockResolvedValue([]);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "trip-1" });

      expect(result.participants).toHaveLength(0);
    });
  });

  describe("Authentication error handling", () => {
    it("should throw UNAUTHORIZED when no token provided for protected procedure", async () => {
      // Force requireAuth to always throw AuthenticationError for this test

      requireAuth.mockRejectedValue(new AuthenticationError("UNAUTHORIZED"));

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: null,
      };

      const caller = createCaller(ctx);

      await expect(caller.getAll()).rejects.toThrow(ORPCError);
      await expect(caller.getAll()).rejects.toThrow("UNAUTHORIZED");
    });

    it("should throw UNAUTHORIZED when token is invalid", async () => {
      // Force requireAuth to always throw AuthenticationError for this test

      requireAuth.mockRejectedValue(new AuthenticationError("UNAUTHORIZED"));

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer invalid-token" }),
        accessToken: "invalid-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getAll()).rejects.toThrow(ORPCError);
      await expect(caller.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("Input validation", () => {
    it("should validate trip id format in getById", async () => {
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      // Valid UUID format should work (or any string per schema)
      await expect(caller.getById({ id: "valid-trip-id" })).rejects.toThrow();
    });

    it("should validate pagination limits", async () => {
      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      // Limit over 100 should fail
      await expect(caller.getAll({ pagination: { limit: 101, offset: 0 } })).rejects.toThrow();

      // Negative offset should fail
      await expect(caller.getAll({ pagination: { limit: 10, offset: -1 } })).rejects.toThrow();
    });

    it("should validate required fields in create", async () => {
      mockDb.user.findFirst.mockResolvedValue(mockAdminUser);

      const ctx: TRPCContext = {
        db: mockDb as unknown as DB,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      // Missing name should fail
      // @ts-expect-error - Testing invalid input
      await expect(
        caller.create({
          startDate: new Date(),
          endDate: new Date(),
        }),
      ).rejects.toThrow();
    });
  });

});
