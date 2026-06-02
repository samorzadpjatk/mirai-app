import { describe, it, expect } from "@jest/globals";
import { buildCommunityFeedQueryFn } from "../../community/useCommunityFeed";

describe("buildCommunityFeedQueryFn", () => {
  it("should return empty feed when no selectedTripId", async () => {
    const trpcClient = {} as typeof import("@mirai-app/orpc/client").orpc;
    const queryFn = buildCommunityFeedQueryFn(null, trpcClient);
    const result = await queryFn({ pageParam: null });

    expect(result.activities).toEqual([]);
    expect(result.pagination.hasMore).toBe(false);
  });
});
