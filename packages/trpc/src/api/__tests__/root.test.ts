import { describe, it, expect } from "vitest";
import { appRouter } from "~/api/root";

describe("appRouter", () => {
  it("should export appRouter", () => {
    expect(appRouter).toBeDefined();
  });

  it("should have all required routers", () => {
    expect(appRouter._def.procedures).toBeDefined();

    // Check that all routers are present
    const routerKeys = Object.keys(appRouter._def.record);
    expect(routerKeys).toContain("group");
    expect(routerKeys).toContain("user");
    expect(routerKeys).toContain("coin");
    expect(routerKeys).toContain("coinTransaction");
    expect(routerKeys).toContain("notifications");
    expect(routerKeys).toContain("notificationSchedule");
    expect(routerKeys).toContain("location");
  });
});
