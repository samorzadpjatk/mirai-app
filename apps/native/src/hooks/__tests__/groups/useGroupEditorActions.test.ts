import { describe, it, expect, jest } from "@jest/globals";
import {
  buildGroupEditorActions,
} from "../../groups/useGroupEditor";

describe("buildGroupEditorActions", () => {
  const createMockMutations = () => ({
    updateMutation: { mutateAsync: jest.fn() },
    assignMutation: { mutateAsync: jest.fn() },
    removeMutation: { mutateAsync: jest.fn() },
  });

  it("should build updateGroup action that resolves tripId and calls mutation", async () => {
    const mutations = createMockMutations();
    const groupQueryData = { trip: { id: "group-trip-id" } };
    const actions = buildGroupEditorActions("group-1", groupQueryData, mutations);

    await actions.updateGroup({ id: "group-1", name: "New Name", tripId: "provided-trip-id" });

    expect(mutations.updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: "group-1",
      name: "New Name",
      tripId: "provided-trip-id",
    });
  });

  it("should fallback to group tripId when no provided tripId", async () => {
    const mutations = createMockMutations();
    const groupQueryData = { trip: { id: "group-trip-id" } };
    const actions = buildGroupEditorActions("group-1", groupQueryData, mutations);

    await actions.updateGroup({ id: "group-1", name: "New Name" });

    expect(mutations.updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: "group-1",
      name: "New Name",
      tripId: "group-trip-id",
    });
  });

  it("should throw when no tripId is available for update", async () => {
    const mutations = createMockMutations();
    const actions = buildGroupEditorActions("group-1", undefined, mutations);

    await expect(actions.updateGroup({ id: "group-1", name: "New Name" })).rejects.toThrow(
      "Missing tripId for updateGroup",
    );
  });

  it("should build assignUser action that calls mutation with correct params", async () => {
    const mutations = createMockMutations();
    const actions = buildGroupEditorActions("group-1", undefined, mutations);

    await actions.assignUser("user-1", "trip-1");

    expect(mutations.assignMutation.mutateAsync).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-1",
      groupId: "group-1",
    });
  });

  it("should use empty string when groupId is null", async () => {
    const mutations = createMockMutations();
    const actions = buildGroupEditorActions(null, undefined, mutations);

    await actions.assignUser("user-1", "trip-1");

    expect(mutations.assignMutation.mutateAsync).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "trip-1",
      groupId: "",
    });
  });

  it("should build removeUser action that resolves tripId and calls mutation", async () => {
    const mutations = createMockMutations();
    const groupQueryData = { trip: { id: "group-trip-id" } };
    const actions = buildGroupEditorActions("group-1", groupQueryData, mutations);

    await actions.removeUser("user-1");

    expect(mutations.removeMutation.mutateAsync).toHaveBeenCalledWith({
      userId: "user-1",
      tripId: "group-trip-id",
    });
  });

  it("should throw when no group tripId for removeUser", async () => {
    const mutations = createMockMutations();
    const actions = buildGroupEditorActions("group-1", undefined, mutations);

    await expect(actions.removeUser("user-1")).rejects.toThrow("Missing tripId for removeUser");
  });
});
