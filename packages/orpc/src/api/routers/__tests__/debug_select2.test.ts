import { describe, it, expect, vi } from "vitest";
import { challengeSubmissions } from "@mirai-app/db";
import { count } from "drizzle-orm";

describe("debug select2", () => {
  it("should resolve count with createDrizzleProxy", async () => {
    const baseMockDb = {
      challengeSubmission: {
        count: vi.fn().mockResolvedValue(3),
      },
    };
    const db = createDrizzleProxy(baseMockDb as any);
    
    const result = await db.select({ count: count() }).from(challengeSubmissions).where(() => {});
    console.log("result:", JSON.stringify(result));
    expect(result).toEqual([{ count: 3 }]);
  });
});
