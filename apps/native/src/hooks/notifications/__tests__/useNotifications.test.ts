/**
 * @jest-environment node
 */

describe("[UNIT] useNotifications", () => {
  test("module exports useNotifications function", async () => {
    const { useNotifications } = await import("../useNotifications");
    expect(useNotifications).toBeDefined();
    expect(typeof useNotifications).toBe("function");
  });
});

describe("[UNIT] useNotificationSchedules", () => {
  test("module exports useNotificationSchedules function", async () => {
    const { useNotificationSchedules } =
      await import("../useNotificationSchedules");
    expect(useNotificationSchedules).toBeDefined();
    expect(typeof useNotificationSchedules).toBe("function");
  });
});

describe("[UNIT] useAutoPushSubscription", () => {
  test("module exports useAutoPushSubscription function", async () => {
    const { useAutoPushSubscription } =
      await import("../useAutoPushSubscription");
    expect(useAutoPushSubscription).toBeDefined();
    expect(typeof useAutoPushSubscription).toBe("function");
  });
});
