/**
 * @jest-environment node
 */

describe("useCommunityFeed", () => {
  test("module exports useCommunityFeed function", async () => {
    const { useCommunityFeed } = await import("../useCommunityFeed");
    expect(useCommunityFeed).toBeDefined();
    expect(typeof useCommunityFeed).toBe("function");
  });
});

describe("useCommunityActivityData", () => {
  test("module exports useCommunityActivityData function", async () => {
    const { useCommunityActivityData } = await import("../useCommunityActivityData");
    expect(useCommunityActivityData).toBeDefined();
    expect(typeof useCommunityActivityData).toBe("function");
  });
});
