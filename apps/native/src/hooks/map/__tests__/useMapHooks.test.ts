/**
 * @jest-environment node
 */

describe("[UNIT] useMapLocationStream", () => {
  test("module exports useMapLocationStream function", async () => {
    const { useMapLocationStream } = await import("../useMapLocationStream");
    expect(useMapLocationStream).toBeDefined();
    expect(typeof useMapLocationStream).toBe("function");
  });
});

describe("[UNIT] useMapUsers", () => {
  test("module exports useMapUsers function", async () => {
    const { useMapUsers } = await import("../useMapUsers");
    expect(useMapUsers).toBeDefined();
    expect(typeof useMapUsers).toBe("function");
  });
});

describe("[UNIT] useMapSelectedUser", () => {
  test("module exports useMapSelectedUser function", async () => {
    const { useMapSelectedUser } = await import("../useMapSelectedUser");
    expect(useMapSelectedUser).toBeDefined();
    expect(typeof useMapSelectedUser).toBe("function");
  });
});

describe("[UNIT] useMapSharing", () => {
  test("module exports useMapSharing function", async () => {
    const { useMapSharing } = await import("../useMapSharing");
    expect(useMapSharing).toBeDefined();
    expect(typeof useMapSharing).toBe("function");
  });
});

describe("[UNIT] useMapActions", () => {
  test("module exports useMapActions function", async () => {
    const { useMapActions } = await import("../useMapActions");
    expect(useMapActions).toBeDefined();
    expect(typeof useMapActions).toBe("function");
  });
});
