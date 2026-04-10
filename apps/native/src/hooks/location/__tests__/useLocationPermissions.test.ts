/**
 * @jest-environment node
 */

describe("useLocationPermissions", () => {
  test("module exports useLocationPermissions function", () => {
    const { useLocationPermissions } = require("../useLocationPermissions");
    expect(useLocationPermissions).toBeDefined();
    expect(typeof useLocationPermissions).toBe("function");
  });
  test("hook accepts no parameters", () => {
    const { useLocationPermissions } = require("../useLocationPermissions");
    expect(useLocationPermissions.length).toBe(0);
  });
});
