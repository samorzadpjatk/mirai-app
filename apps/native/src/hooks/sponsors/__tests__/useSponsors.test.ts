/**
 * @jest-environment node
 */

describe("[UNIT] useSponsors", () => {
  test("module exports useSponsors function", async () => {
    const { useSponsors } = await import("../useSponsors");
    expect(useSponsors).toBeDefined();
    expect(typeof useSponsors).toBe("function");
  });
});
