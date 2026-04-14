/**
 * @jest-environment node
 */

describe("[UNIT] useRewards", () => {
  test("module exports useRewards function", async () => {
    const { useRewards } = await import("../index");
    expect(useRewards).toBeDefined();
    expect(typeof useRewards).toBe("function");
  });
});
