/**
 * @jest-environment node
 */

describe("useCommunityFeed", () => {
  test("module exports useCommunityFeed function", () => {
    const { useCommunityFeed } = require("../useCommunityFeed");
    expect(useCommunityFeed).toBeDefined();
    expect(typeof useCommunityFeed).toBe("function");
  });
});

describe("useCommunityActivityData", () => {
  test("module exports useCommunityActivityData function", () => {
    const { useCommunityActivityData } = require("../useCommunityActivityData");
    expect(useCommunityActivityData).toBeDefined();
    expect(typeof useCommunityActivityData).toBe("function");
  });
});
