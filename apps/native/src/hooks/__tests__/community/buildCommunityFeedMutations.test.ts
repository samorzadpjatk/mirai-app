import { describe, it, expect, jest } from "@jest/globals";
import {
  buildCommunityFeedQueryFn,
  buildToggleHeartMutation,
} from "../../community/useCommunityFeed";

describe("buildCommunityFeedQueryFn", () => {
  it("should return empty feed when no selectedTripId", async () => {
    const trpcClient = {} as typeof import("@mirai-app/orpc/client").orpc;
    const queryFn = buildCommunityFeedQueryFn(null, trpcClient);
    const result = await queryFn({ pageParam: null });

    expect(result.activities).toEqual([]);
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe("buildToggleHeartMutation", () => {
  it("should build mutation config with correct structure", () => {
    const mockQueryClient = {
      cancelQueries: jest.fn(),
      getQueryData: jest.fn().mockReturnValue({ pages: [] }),
      setQueryData: jest.fn(),
    };

    const config = {
      trpcClient: {} as typeof import("@mirai-app/orpc/client").orpc,
      queryClient: mockQueryClient as unknown as ReturnType<typeof import("@tanstack/react-query").useQueryClient>,
      feedQueryKey: ["community-feed", "trip-1", 30] as const,
      selectedTripId: "trip-1",
    };

    const mutation = buildToggleHeartMutation(config);

    expect(mutation.mutationFn).toBeDefined();
    expect(mutation.onMutate).toBeDefined();
    expect(mutation.onError).toBeDefined();
    expect(mutation.onSuccess).toBeDefined();
  });

  it("should return undefined from onMutate when no selectedTripId", async () => {
    const mockQueryClient = {
      cancelQueries: jest.fn(),
      getQueryData: jest.fn(),
      setQueryData: jest.fn(),
    };

    const config = {
      trpcClient: {} as typeof import("@mirai-app/orpc/client").orpc,
      queryClient: mockQueryClient as unknown as ReturnType<typeof import("@tanstack/react-query").useQueryClient>,
      feedQueryKey: null,
      selectedTripId: null,
    };

    const mutation = buildToggleHeartMutation(config);
    const result = await mutation.onMutate?.({ activityId: "a1" });

    expect(result).toBeUndefined();
  });
});
