 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import {
  ensureTripNotEnded,
  ensureTripNotEndedByGroupId,
} from "../tripGuards";
import type { DB } from "@mirai-app/db";

describe("tripGuards", () => {
  let mockDb: DB;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      trip: {
        findUnique: vi.fn(),
      },
      group: {
        findUnique: vi.fn(),
      },
    };
  });

  describe("ensureTripNotEnded", () => {
    it("should not throw for active trip", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      });

      await expect(
        ensureTripNotEnded(mockDb, "trip-1")
      ).resolves.not.toThrow();
    });

    it("should not throw for trip ended within grace period", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: recentEndDate,
      });

      await expect(
        ensureTripNotEnded(mockDb, "trip-1")
      ).resolves.not.toThrow();
    });

    it("should throw NOT_FOUND for non-existent trip", async () => {
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue(null);

      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        ORPCError
      );
      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        "Trip not found"
      );

      try {
        await ensureTripNotEnded(mockDb, "trip-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN for trip ended beyond grace period", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: oldEndDate,
      });

      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        ORPCError
      );
      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        "Trip has ended"
      );

      try {
        await ensureTripNotEnded(mockDb, "trip-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
      }
    });

    it("should throw FORBIDDEN for trip ended exactly at grace period boundary", async () => {
      const gracePeriodBoundary = new Date(
        Date.now() - 24 * 60 * 60 * 1000 - 1000
      );
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: gracePeriodBoundary,
      });

      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        ORPCError
      );

      try {
        await ensureTripNotEnded(mockDb, "trip-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
      }
    });

    it("should query trip with correct ID", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      });

      await ensureTripNotEnded(mockDb, "trip-1");

       
      expect(mockDb.trip.findUnique).toHaveBeenCalledWith({
        where: { id: "trip-1" },
        select: { endDate: true },
      });
    });
  });

  describe("ensureTripNotEndedByGroupId", () => {
    it("should return tripId for valid active group", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      });

      const result = await ensureTripNotEndedByGroupId(mockDb, "group-1");

      expect(result).toBe("trip-1");
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue(null);

      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow(ORPCError);
      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow("Group not found");

      try {
        await ensureTripNotEndedByGroupId(mockDb, "group-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
      }
    });

    it("should throw NOT_FOUND for deleted group", async () => {
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: true,
      });

      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow(ORPCError);
      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow("Group not found");

      try {
        await ensureTripNotEndedByGroupId(mockDb, "group-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN when trip has ended", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: oldEndDate,
      });

      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow(ORPCError);
      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow("Trip has ended");
    });

    it("should query group with correct ID", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      });

      await ensureTripNotEndedByGroupId(mockDb, "group-1");

       
      expect(mockDb.group.findUnique).toHaveBeenCalledWith({
        where: { id: "group-1" },
        select: { tripId: true, isDeleted: true },
      });
    });

    it("should query trip with correct tripId from group", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      });

      await ensureTripNotEndedByGroupId(mockDb, "group-1");

       
      expect(mockDb.trip.findUnique).toHaveBeenCalledWith({
        where: { id: "trip-1" },
        select: { endDate: true },
      });
    });

    it("should work with group in grace period trip", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
       
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: recentEndDate,
      });

      const result = await ensureTripNotEndedByGroupId(mockDb, "group-1");

      expect(result).toBe("trip-1");
    });
  });
});
