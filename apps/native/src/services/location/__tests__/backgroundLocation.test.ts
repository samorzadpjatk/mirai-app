/**
 * @jest-environment node
 */

// Tests for background location service

describe("[UNIT] backgroundLocation service", () => {
  test("exports getBackgroundLocationPreference function", async () => {
    const { getBackgroundLocationPreference } =
      await import("../backgroundLocation");
    expect(getBackgroundLocationPreference).toBeDefined();
    expect(typeof getBackgroundLocationPreference).toBe("function");
  });

  test("exports setBackgroundLocationPreference function", async () => {
    const { setBackgroundLocationPreference } =
      await import("../backgroundLocation");
    expect(setBackgroundLocationPreference).toBeDefined();
    expect(typeof setBackgroundLocationPreference).toBe("function");
  });

  test("exports hasBackgroundLocationTaskStarted function", async () => {
    const { hasBackgroundLocationTaskStarted } =
      await import("../backgroundLocation");
    expect(hasBackgroundLocationTaskStarted).toBeDefined();
    expect(typeof hasBackgroundLocationTaskStarted).toBe("function");
  });

  test("exports startBackgroundLocationTask function", async () => {
    const { startBackgroundLocationTask } =
      await import("../backgroundLocation");
    expect(startBackgroundLocationTask).toBeDefined();
    expect(typeof startBackgroundLocationTask).toBe("function");
  });

  test("exports stopBackgroundLocationTask function", async () => {
    const { stopBackgroundLocationTask } =
      await import("../backgroundLocation");
    expect(stopBackgroundLocationTask).toBeDefined();
    expect(typeof stopBackgroundLocationTask).toBe("function");
  });

  test("getBackgroundLocationPreference returns a boolean", async () => {
    const { getBackgroundLocationPreference } =
      await import("../backgroundLocation");
    const result = await getBackgroundLocationPreference();
    expect(typeof result).toBe("boolean");
  });

  test("setBackgroundLocationPreference accepts boolean parameter", async () => {
    const { setBackgroundLocationPreference } =
      await import("../backgroundLocation");
    expect(setBackgroundLocationPreference.length).toBe(1);
  });
});

describe("[UNIT] location constants", () => {
  test("exports LOCATION_SHARING_SETTINGS_KEY", async () => {
    const { LOCATION_SHARING_SETTINGS_KEY } = await import("../constants");
    expect(LOCATION_SHARING_SETTINGS_KEY).toBeDefined();
    expect(typeof LOCATION_SHARING_SETTINGS_KEY).toBe("string");
  });

  test("exports BACKGROUND_LOCATION_SETTINGS_KEY", async () => {
    const { BACKGROUND_LOCATION_SETTINGS_KEY } = await import("../constants");
    expect(BACKGROUND_LOCATION_SETTINGS_KEY).toBeDefined();
    expect(typeof BACKGROUND_LOCATION_SETTINGS_KEY).toBe("string");
  });

  test("exports BACKGROUND_LOCATION_TASK_NAME", async () => {
    const { BACKGROUND_LOCATION_TASK_NAME } = await import("../constants");
    expect(BACKGROUND_LOCATION_TASK_NAME).toBeDefined();
    expect(typeof BACKGROUND_LOCATION_TASK_NAME).toBe("string");
  });
});
