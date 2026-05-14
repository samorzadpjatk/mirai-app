 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sponsorRouter } from "../sponsor";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../../api/trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, Sponsor, TripSponsor, Trip, User } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import * as auth from "@mirai-app/auth";

const createCaller = (ctx: TRPCContext) => createRouterClient(sponsorRouter, { context: ctx });

describe("sponsorRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;

  const createMockSponsor = (overrides: Partial<Sponsor> = {}): Sponsor => ({
    id: "sponsor-1",
    name: "Test Sponsor",
    description: "A test sponsor",
    logoPath: "https://example.com/logo.png",
    height: null,
    offsetX: null,
    offsetY: null,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockTripSponsor = (overrides: Partial<TripSponsor> = {}): TripSponsor => ({
    id: "trip-sponsor-1",
    tripId: "trip-1",
    sponsorId: "sponsor-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockTrip = (overrides: Partial<Trip> = {}): Trip => ({
    id: "trip-1",
    name: "Test Trip",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-07"),
    description: null,
    isRegistrationOpen: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      sponsor: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockSponsor()),
        update: vi.fn().mockResolvedValue(createMockSponsor()),
        delete: vi.fn().mockResolvedValue(createMockSponsor()),
      },
      tripSponsor: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockTripSponsor()),
        delete: vi.fn().mockResolvedValue(createMockTripSponsor()),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue(createMockTrip()),
        findFirst: vi.fn().mockResolvedValue(createMockTrip()),
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([createMockSponsor()])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([createMockSponsor()])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([createMockSponsor()])),
        })),
      })),
    };

    mockDb.query = {
      sponsors: mockDb.sponsor,
      tripSponsors: mockDb.tripSponsor,
      trips: mockDb.trip,
    };

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123", email: "admin@example.com" } }, error: null }),
        },
      },
    } satisfies SupabaseClient;
  });

  describe("getAll", () => {
    it("should return all active sponsors", async () => {
      const mockSponsors = [
        createMockSponsor({ id: "sponsor-1", name: "Sponsor One" }),
        createMockSponsor({ id: "sponsor-2", name: "Sponsor Two" }),
      ];
       
      mockDb.query.sponsors.findMany.mockResolvedValue(mockSponsors);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.getAll();

      expect(result).toEqual(mockSponsors);
       
      expect(mockDb.query.sponsors.findMany).toHaveBeenCalled();;
    });
  });

  describe("getById", () => {
    it("should return sponsor by id", async () => {
      const mockSponsor = createMockSponsor({ id: "sponsor-123" });
       
      mockDb.query.sponsors.findFirst.mockResolvedValue(mockSponsor);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.getById({ id: "sponsor-123" });

      expect(result).toEqual(mockSponsor);
    });

    it("should throw NOT_FOUND when sponsor doesn't exist", async () => {
       
      mockDb.query.sponsors.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };
      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "nonexistent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("getByTripId", () => {
    it("should return sponsors for a trip", async () => {
      const mockTripSponsors = [
        createMockTripSponsor({
          sponsor: createMockSponsor({ id: "sponsor-1", name: "Sponsor One" }),
        }),
        createMockTripSponsor({
          sponsor: createMockSponsor({ id: "sponsor-2", name: "Sponsor Two" }),
        }),
      ];
       
      mockDb.query.tripSponsors.findMany.mockResolvedValue(mockTripSponsors);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.getByTripId({ tripId: "trip-1" });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Sponsor One");
      expect(result[1].name).toBe("Sponsor Two");
    });
  });

  describe("create", () => {
    it("should create a sponsor as admin", async () => {
      const newSponsor = createMockSponsor({
        id: "new-sponsor",
        name: "New Sponsor",
        description: "New Description",
        logoPath: "https://example.com/new-logo.png",
      });
       
      mockDb.insert.mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newSponsor])),
        })),
      });
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.create({
        name: "New Sponsor",
        description: "New Description",
        logoPath: "https://example.com/new-logo.png",
      });

      expect(result.name).toBe("New Sponsor");
       
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a sponsor as admin", async () => {
      const existingSponsor = createMockSponsor({ id: "sponsor-123" });
      const updatedSponsor = createMockSponsor({
        id: "sponsor-123",
        name: "Updated Name",
      });
       
      mockDb.query.sponsors.findFirst.mockResolvedValue(existingSponsor);
       
      mockDb.update.mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([updatedSponsor])),
          })),
        })),
      });
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.update({
        id: "sponsor-123",
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
    });

    it("should throw NOT_FOUND when updating non-existent sponsor", async () => {
       
      mockDb.query.sponsors.findFirst.mockResolvedValue(null);
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      await expect(
        caller.update({ id: "nonexistent", name: "New Name" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("delete", () => {
    it("should delete a sponsor as admin", async () => {
      const sponsorToDelete = createMockSponsor({ id: "sponsor-123" });
       
      mockDb.delete.mockReturnValue({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([sponsorToDelete])),
      })),
    });
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.delete({ id: "sponsor-123" });

      expect(result.id).toBe("sponsor-123");
       
      expect(mockDb.delete).toHaveBeenCalled();;
    });
  });

  describe("addToTrip", () => {
    it("should add sponsor to trip as admin", async () => {
      const mockTrip = createMockTrip();
      const mockSponsor = createMockSponsor();
      const mockTripSponsor = createMockTripSponsor();
      
       
      mockDb.query.trips.findFirst.mockResolvedValue(mockTrip);
       
      mockDb.query.sponsors.findFirst.mockResolvedValue(mockSponsor);
       
      mockDb.query.tripSponsors.findFirst.mockResolvedValue(null);
       
      mockDb.insert.mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockTripSponsor])),
        })),
      });
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.addToTrip({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });

      expect(result).toBeDefined();
    });

    it("should throw CONFLICT when sponsor already added to trip", async () => {
      const mockTrip = createMockTrip();
      const mockSponsor = createMockSponsor();
      const existingTripSponsor = createMockTripSponsor();
      
       
      mockDb.query.trips.findFirst.mockResolvedValue(mockTrip);
       
      mockDb.query.sponsors.findFirst.mockResolvedValue(mockSponsor);
       
      mockDb.query.tripSponsors.findFirst.mockResolvedValue(existingTripSponsor);
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      await expect(
        caller.addToTrip({ tripId: "trip-1", sponsorId: "sponsor-1" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("removeFromTrip", () => {
    it("should remove sponsor from trip as admin", async () => {
      const mockTripSponsor = createMockTripSponsor();
       
      mockDb.delete.mockReturnValue({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockTripSponsor])),
      })),
    });
      auth.requireAdmin.mockResolvedValue({
        user: { id: "auth-123", email: "admin@example.com" },
        dbUser: { id: "admin-123", role: "ADMIN" } as User,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.removeFromTrip({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });

      expect(result).toBeDefined();
       
      expect(mockDb.delete).toHaveBeenCalled();;
    });
  });
});
