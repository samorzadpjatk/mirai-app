 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "../../api/trpc";
import {
  ensureTripNotEnded,
  ensureTripNotEndedByGroupId,
} from "../tripGuards";
import type { PrismaClient } from "@mirai-app/db";

describe("tripGuards", () => {
  let mockDb: PrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      trip: {
        findUnique: vi.fn(),
      },
      group: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaClient;
  });

  describe("ensureTripNotEnded", () => {
    it("should not throw for active trip", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      } as never);

      await expect(
        ensureTripNotEnded(mockDb, "trip-1")
      ).resolves.not.toThrow();
    });

    it("should not throw for trip ended within grace period", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: recentEndDate,
      } as never);

      await expect(
        ensureTripNotEnded(mockDb, "trip-1")
      ).resolves.not.toThrow();
    });

    it("should throw NOT_FOUND for non-existent trip", async () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue(null);

      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        TRPCError
      );
      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        "Trip not found"
      );

      try {
        await ensureTripNotEnded(mockDb, "trip-1");
      } catch (error) {
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN for trip ended beyond grace period", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: oldEndDate,
      } as never);

      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        TRPCError
      );
      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        "Trip has ended"
      );

      try {
        await ensureTripNotEnded(mockDb, "trip-1");
      } catch (error) {
        expect((error as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    it("should throw FORBIDDEN for trip ended exactly at grace period boundary", async () => {
      const gracePeriodBoundary = new Date(
        Date.now() - 24 * 60 * 60 * 1000 - 1000
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: gracePeriodBoundary,
      } as never);

      await expect(ensureTripNotEnded(mockDb, "trip-1")).rejects.toThrow(
        TRPCError
      );

      try {
        await ensureTripNotEnded(mockDb, "trip-1");
      } catch (error) {
        expect((error as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    it("should query trip with correct ID", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      } as never);

      await ensureTripNotEnded(mockDb, "trip-1");

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.trip.findUnique).toHaveBeenCalledWith({
        where: { id: "trip-1" },
        select: { endDate: true },
      });
    });
  });

  describe("ensureTripNotEndedByGroupId", () => {
    it("should return tripId for valid active group", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      } as never);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      } as never);

      const result = await ensureTripNotEndedByGroupId(mockDb, "group-1");

      expect(result).toBe("trip-1");
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue(null);

      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow(TRPCError);
      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow("Group not found");

      try {
        await ensureTripNotEndedByGroupId(mockDb, "group-1");
      } catch (error) {
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: true,
      } as never);

      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow(TRPCError);
      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow("Group not found");

      try {
        await ensureTripNotEndedByGroupId(mockDb, "group-1");
      } catch (error) {
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN when trip has ended", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      } as never);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: oldEndDate,
      } as never);

      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow(TRPCError);
      await expect(
        ensureTripNotEndedByGroupId(mockDb, "group-1")
      ).rejects.toThrow("Trip has ended");
    });

    it("should query group with correct ID", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      } as never);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      } as never);

      await ensureTripNotEndedByGroupId(mockDb, "group-1");

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.group.findUnique).toHaveBeenCalledWith({
        where: { id: "group-1" },
        select: { tripId: true, isDeleted: true },
      });
    });

    it("should query trip with correct tripId from group", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      } as never);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: futureDate,
      } as never);

      await ensureTripNotEndedByGroupId(mockDb, "group-1");

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.trip.findUnique).toHaveBeenCalledWith({
        where: { id: "trip-1" },
        select: { endDate: true },
      });
    });

    it("should work with group in grace period trip", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.group.findUnique).mockResolvedValue({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      } as never);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      vi.mocked(mockDb.trip.findUnique).mockResolvedValue({
        id: "trip-1",
        endDate: recentEndDate,
      } as never);

      const result = await ensureTripNotEndedByGroupId(mockDb, "group-1");

      expect(result).toBe("trip-1");
    });
  });
});
