/**
 * @jest-environment node
 */

describe("useMapLocationStream", () => {
  test("module exports useMapLocationStream function", async () => {
    const { useMapLocationStream } = await import("../useMapLocationStream");
    expect(useMapLocationStream).toBeDefined();
    expect(typeof useMapLocationStream).toBe("function");
  });
});

describe("useMapUsers", () => {
  test("module exports useMapUsers function", async () => {
    const { useMapUsers } = await import("../useMapUsers");
    expect(useMapUsers).toBeDefined();
    expect(typeof useMapUsers).toBe("function");
  });
});

describe("useMapSelectedUser", () => {
  test("module exports useMapSelectedUser function", async () => {
    const { useMapSelectedUser } = await import("../useMapSelectedUser");
    expect(useMapSelectedUser).toBeDefined();
    expect(typeof useMapSelectedUser).toBe("function");
  });
});

describe("useMapSharing", () => {
  test("module exports useMapSharing function", async () => {
    const { useMapSharing } = await import("../useMapSharing");
    expect(useMapSharing).toBeDefined();
    expect(typeof useMapSharing).toBe("function");
  });
});

describe("useMapActions", () => {
  test("module exports useMapActions function", async () => {
    const { useMapActions } = await import("../useMapActions");
    expect(useMapActions).toBeDefined();
    expect(typeof useMapActions).toBe("function");
  });
});
