/**
 * @jest-environment node
 */

describe("useLocationPermissions", () => {
  test("module exports useLocationPermissions function", async () => {
    const { useLocationPermissions } = await import("../useLocationPermissions");
    expect(useLocationPermissions).toBeDefined();
    expect(typeof useLocationPermissions).toBe("function");
  });
  test("hook accepts no parameters", async () => {
    const { useLocationPermissions } = await import("../useLocationPermissions");
    expect(useLocationPermissions.length).toBe(0);
  });
});
