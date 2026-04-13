import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  DrizzleTripAccessChecker,
  type GroupLeaderCheckResult,
} from "../trip-access";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";

// Mock the drizzle database
const createMockDb = (returnData: unknown) =>
  ({
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(() => Promise.resolve(returnData)),
        })),
      })),
    })),
  }) as unknown as DrizzleDb;

describe("[UNIT] DrizzleTripAccessChecker", () => {
  let service: DrizzleTripAccessChecker;

  beforeEach(() => {
    service = new DrizzleTripAccessChecker({} as DrizzleDb);
  });

  describe("isStaff", () => {
    it("should return true for admin", async () => {
      const mockDb = createMockDb([{ role: "ADMIN" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      const result = await Effect.runPromise(testService.isStaff("user-123"));

      expect(result).toBe(true);
    });

    it("should return true for moderator", async () => {
      const mockDb = createMockDb([{ role: "MODERATOR" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      const result = await Effect.runPromise(testService.isStaff("user-123"));

      expect(result).toBe(true);
    });

    it("should return false for regular participant", async () => {
      const mockDb = createMockDb([{ role: "PARTICIPANT" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      const result = await Effect.runPromise(testService.isStaff("user-123"));

      expect(result).toBe(false);
    });

    it("should return false when user not found", async () => {
      const mockDb = createMockDb([]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      const result = await Effect.runPromise(testService.isStaff("user-123"));

      expect(result).toBe(false);
    });

    it("should return Effect that can be run", () => {
      const effect = service.isStaff("user-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });

  describe("isGroupLeader", () => {
    it("should return Effect that can be run", () => {
      const effect = service.isGroupLeader("user-123", "trip-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });

  describe("hasTripEnded", () => {
    it("should return Effect that can be run", () => {
      const effect = service.hasTripEnded("trip-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });
});
