/**
 * @jest-environment node
 */

describe("useSupabase", () => {
  test("module exports useSupabase function", async () => {
    const { useSupabase } = await import("../useSupabase");
    expect(useSupabase).toBeDefined();
    expect(typeof useSupabase).toBe("function");
  });
});
