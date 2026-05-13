 
 
 
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
        create: vi.fn().mockResolvedValue(createMockSponsor()),
        update: vi.fn().mockResolvedValue(createMockSponsor()),
        delete: vi.fn().mockResolvedValue(createMockSponsor()),
      },
      tripSponsor: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createMockTripSponsor()),
        delete: vi.fn().mockResolvedValue(createMockTripSponsor()),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue(createMockTrip()),
      },
    };

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123", email: "admin@example.com" } }, error: null }),
        },
      },
    } as unknown as SupabaseClient;
  });

  describe("getAll", () => {
    it("should return all active sponsors", async () => {
      const mockSponsors = [
        createMockSponsor({ id: "sponsor-1", name: "Sponsor One" }),
        createMockSponsor({ id: "sponsor-2", name: "Sponsor Two" }),
      ];
       
      mockDb.sponsor.findMany.mockResolvedValue(mockSponsors);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };
      const caller = createCaller(ctx);

      const result = await caller.getAll();

      expect(result).toEqual(mockSponsors);
       
      expect(mockDb.sponsor.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("getById", () => {
    it("should return sponsor by id", async () => {
      const mockSponsor = createMockSponsor({ id: "sponsor-123" });
       
      mockDb.sponsor.findUnique.mockResolvedValue(mockSponsor);

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
       
      mockDb.sponsor.findUnique.mockResolvedValue(null);

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
       
      mockDb.tripSponsor.findMany.mockResolvedValue(mockTripSponsors);

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
       
      mockDb.sponsor.create.mockResolvedValue(newSponsor);
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
       
      expect(mockDb.sponsor.create).toHaveBeenCalledWith({
        data: {
          name: "New Sponsor",
          description: "New Description",
          logoPath: "https://example.com/new-logo.png",
          isActive: true,
        },
      });
    });
  });

  describe("update", () => {
    it("should update a sponsor as admin", async () => {
      const existingSponsor = createMockSponsor({ id: "sponsor-123" });
      const updatedSponsor = createMockSponsor({
        id: "sponsor-123",
        name: "Updated Name",
      });
       
      mockDb.sponsor.findUnique.mockResolvedValue(existingSponsor);
       
      mockDb.sponsor.update.mockResolvedValue(updatedSponsor);
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
       
      mockDb.sponsor.findUnique.mockResolvedValue(null);
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
       
      mockDb.sponsor.delete.mockResolvedValue(sponsorToDelete);
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
       
      expect(mockDb.sponsor.delete).toHaveBeenCalledWith({
        where: { id: "sponsor-123" },
      });
    });
  });

  describe("addToTrip", () => {
    it("should add sponsor to trip as admin", async () => {
      const mockTrip = createMockTrip();
      const mockSponsor = createMockSponsor();
      const mockTripSponsor = createMockTripSponsor();
      
       
      mockDb.trip.findUnique.mockResolvedValue(mockTrip);
       
      mockDb.sponsor.findUnique.mockResolvedValue(mockSponsor);
       
      mockDb.tripSponsor.findUnique.mockResolvedValue(null);
       
      mockDb.tripSponsor.create.mockResolvedValue(mockTripSponsor);
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
      
       
      mockDb.trip.findUnique.mockResolvedValue(mockTrip);
       
      mockDb.sponsor.findUnique.mockResolvedValue(mockSponsor);
       
      mockDb.tripSponsor.findUnique.mockResolvedValue(existingTripSponsor);
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
       
      mockDb.tripSponsor.delete.mockResolvedValue(mockTripSponsor);
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
       
      expect(mockDb.tripSponsor.delete).toHaveBeenCalledWith({
        where: {
          tripId_sponsorId: {
            tripId: "trip-1",
            sponsorId: "sponsor-1",
          },
        },
      });
    });
  });
});
