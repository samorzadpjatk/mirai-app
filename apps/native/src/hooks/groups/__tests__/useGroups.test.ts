/**
 * @jest-environment node
 */

// Tests for groups hooks - verify module structure and exports

describe("useGroups", () => {
  test("module exports useGroups function", async () => {
    const { useGroups } = await import("../useGroups");
    expect(useGroups).toBeDefined();
    expect(typeof useGroups).toBe("function");
  });

  test("hook accepts tripId parameter", async () => {
    const { useGroups } = await import("../useGroups");
    expect(useGroups.length).toBe(1);
  });
});

describe("useGroupDetails", () => {
  test("module exports useGroupDetails function", async () => {
    const { useGroupDetails } = await import("../useGroupDetails");
    expect(useGroupDetails).toBeDefined();
    expect(typeof useGroupDetails).toBe("function");
  });

  test("hook accepts groupId parameter", async () => {
    const { useGroupDetails } = await import("../useGroupDetails");
    expect(useGroupDetails.length).toBe(1);
  });
});

describe("useCreateGroup", () => {
  test("module exports useCreateGroup function", async () => {
    const { useCreateGroup } = await import("../useCreateGroup");
    expect(useCreateGroup).toBeDefined();
    expect(typeof useCreateGroup).toBe("function");
  });

  test("hook accepts tripId parameter", async () => {
    const { useCreateGroup } = await import("../useCreateGroup");
    expect(useCreateGroup.length).toBe(1);
  });
});

describe("useGroupEditor", () => {
  test("module exports useGroupEditor function", async () => {
    const { useGroupEditor } = await import("../useGroupEditor");
    expect(useGroupEditor).toBeDefined();
    expect(typeof useGroupEditor).toBe("function");
  });

  test("hook accepts groupId parameter", async () => {
    const { useGroupEditor } = await import("../useGroupEditor");
    expect(useGroupEditor.length).toBe(1);
  });
});

describe("useMyGroup", () => {
  test("module exports useMyGroup function", async () => {
    const { useMyGroup } = await import("../useMyGroup");
    expect(useMyGroup).toBeDefined();
    expect(typeof useMyGroup).toBe("function");
  });

  test("hook accepts tripId parameter", async () => {
    const { useMyGroup } = await import("../useMyGroup");
    expect(useMyGroup.length).toBe(1);
  });
});

describe("Groups Hooks Index", () => {
  test("all hooks exported from index", async () => {
    const index = await import("../index");
    expect(index.useGroups).toBeDefined();
    expect(index.useGroupDetails).toBeDefined();
    expect(index.useCreateGroup).toBeDefined();
    expect(index.useGroupEditor).toBeDefined();
    expect(index.useMyGroup).toBeDefined();
  });

  test("all exports are functions", async () => {
    const index = await import("../index");
    expect(typeof index.useGroups).toBe("function");
    expect(typeof index.useGroupDetails).toBe("function");
    expect(typeof index.useCreateGroup).toBe("function");
    expect(typeof index.useGroupEditor).toBe("function");
    expect(typeof index.useMyGroup).toBe("function");
  });
});
