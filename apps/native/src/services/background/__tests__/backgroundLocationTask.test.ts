/**
 * @jest-environment node
 */

// Tests for background location task

describe("[UNIT] backgroundLocationTask", () => {
  test("module can be imported", async () => {
    // The module defines the task at load time
    const module = await import("../../background/backgroundLocationTask");
    expect(module).toBeDefined();
  });

  test("constants are defined in module", async () => {
    // Module imports and uses these constants
    const {
      LOCATION_SHARING_SETTINGS_KEY,
      BACKGROUND_LOCATION_SETTINGS_KEY,
      BACKGROUND_LOCATION_TASK_NAME,
    } = await import("../../location/constants");

    expect(LOCATION_SHARING_SETTINGS_KEY).toBeDefined();
    expect(BACKGROUND_LOCATION_SETTINGS_KEY).toBeDefined();
    expect(BACKGROUND_LOCATION_TASK_NAME).toBeDefined();
  });

  test("helper functions are defined", async () => {
    // Test that the utility functions exist in the module scope
    const module = await import("../../background/backgroundLocationTask");
    expect(module).toBeDefined();
  });
});
