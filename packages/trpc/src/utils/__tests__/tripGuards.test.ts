import { describe, expect, test, mock } from "bun:test";
import { TRPCError } from "@trpc/server";
import { ensureTripNotEnded, ensureTripNotEndedByGroupId } from "../tripGuards";

describe("tripGuards", () => {
  describe("ensureTripNotEnded", () => {
    test("does not throw when trip has not ended", async () => {
      const futureEndDate = new Date(Date.now() + 86400000);
      const db = {
        trip: {
          findUnique: mock().mockResolvedValueOnce({ endDate: futureEndDate }),
        },
      } as any;

      await expect(ensureTripNotEnded(db, "trip-1")).resolves.toBeUndefined();
    });

    test("does not throw when trip ended less than 24 hours ago", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const db = {
        trip: {
          findUnique: mock().mockResolvedValueOnce({ endDate: recentEndDate }),
        },
      } as any;

      await expect(ensureTripNotEnded(db, "trip-1")).resolves.toBeUndefined();
    });

    test("throws FORBIDDEN when trip ended more than 24 hours ago", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const db = {
        trip: {
          findUnique: mock().mockResolvedValueOnce({ endDate: oldEndDate }),
        },
      } as any;

      await expect(ensureTripNotEnded(db, "trip-1")).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Trip has ended",
      });
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      const db = {
        trip: {
          findUnique: mock().mockResolvedValueOnce(null),
        },
      } as any;

      await expect(
        ensureTripNotEnded(db, "non-existent"),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Trip not found",
      });
    });
  });

  describe("ensureTripNotEndedByGroupId", () => {
    test("returns tripId when group exists and trip has not ended", async () => {
      const futureEndDate = new Date(Date.now() + 86400000);
      const db = {
        group: {
          findUnique: mock().mockResolvedValueOnce({
            tripId: "trip-1",
            isDeleted: false,
          }),
        },
        trip: {
          findUnique: mock().mockResolvedValueOnce({ endDate: futureEndDate }),
        },
      } as any;

      const result = await ensureTripNotEndedByGroupId(db, "group-1");
      expect(result).toBe("trip-1");
    });

    test("throws NOT_FOUND when group does not exist", async () => {
      const db = {
        group: {
          findUnique: mock().mockResolvedValueOnce(null),
        },
      } as any;

      await expect(
        ensureTripNotEndedByGroupId(db, "non-existent"),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Group not found",
      });
    });

    test("throws NOT_FOUND when group is deleted", async () => {
      const db = {
        group: {
          findUnique: mock().mockResolvedValueOnce({
            tripId: "trip-1",
            isDeleted: true,
          }),
        },
      } as any;

      await expect(
        ensureTripNotEndedByGroupId(db, "deleted-group"),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Group not found",
      });
    });

    test("throws FORBIDDEN when associated trip has ended", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const db = {
        group: {
          findUnique: mock().mockResolvedValueOnce({
            tripId: "trip-1",
            isDeleted: false,
          }),
        },
        trip: {
          findUnique: mock().mockResolvedValueOnce({ endDate: oldEndDate }),
        },
      } as any;

      await expect(
        ensureTripNotEndedByGroupId(db, "group-1"),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Trip has ended",
      });
    });
  });
});
