import { describe, it, expect, vi, beforeEach } from "vitest";
import { challengeSubmissions } from "@mirai-app/db";
import { count } from "drizzle-orm";

describe("debug vote", () => {
  let mockDb: any;

  beforeEach(() => {
    const baseMockDb = {
      challengeSubmission: {
        count: vi.fn().mockResolvedValue(3),
      },
    };
    mockDb = createDrizzleProxy(baseMockDb as any);
    const passthroughReturning = (data: unknown) => ({
      returning: () => Promise.resolve([data]),
      onConflictDoNothing: () => Promise.resolve([data]),
      onConflictDoUpdate: () => Promise.resolve([data]),
    });
    mockDb.insert = () => ({
      values: (data: unknown) => passthroughReturning(data),
    });
    mockDb.update = () => ({
      set: (data: unknown) => ({
        where: () => passthroughReturning(data),
      }),
    });
    mockDb.delete = () => ({
      where: () => Promise.resolve({ count: 1 }),
    });
  });

  it("should resolve count like challengeVote test", async () => {
    const result = await mockDb.select({ count: count() }).from(challengeSubmissions).where(() => {});
    console.log("result:", JSON.stringify(result));
    expect(result).toEqual([{ count: 3 }]);
  });
});
