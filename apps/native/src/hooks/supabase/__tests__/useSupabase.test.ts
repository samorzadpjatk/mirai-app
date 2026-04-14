/**
 * @jest-environment node
 */

describe("[UNIT] useSupabase", () => {
  test("module exports useSupabase function", async () => {
    const { useSupabase } = await import("../useSupabase");
    expect(useSupabase).toBeDefined();
    expect(typeof useSupabase).toBe("function");
  });
});
