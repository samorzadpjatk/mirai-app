import { describe, it, expect, vi } from "vitest";
import { challengeSubmissions } from "@mirai-app/db";

describe("debug select", () => {
  it("should resolve count", async () => {
    const baseMockDb = {
      challengeSubmission: {
        count: vi.fn().mockResolvedValue(3),
      },
    };
    const db = createDrizzleProxy(baseMockDb as any);
    const result = await db.select({ count: () => {} }).from(challengeSubmissions).where(() => {});
    console.log("result:", result);
    expect(result).toEqual([{ count: 3 }]);
  });
});
