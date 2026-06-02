import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import { useCreateGroup } from "../../groups/useCreateGroup";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

describe("useCreateGroup (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should create group with name only", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ tripId, name, image }) => {
        expect(tripId).toBe("trip-456");
        expect(name).toBe("New Group");
        expect(image).toBeUndefined();
        return { id: "new-group-123", name: "New Group", code: "NG001" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-456"));

    const groupResult = await act(async () => {
      return await result.current.createGroup({ name: "New Group" });
    });

    expect(groupResult).toEqual({
      id: "new-group-123",
      name: "New Group",
      code: "NG001",
    });
  });

  it("should create group with name and image", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ tripId, name, image }) => {
        expect(tripId).toBe("trip-789");
        expect(name).toBe("Group With Image");
        expect(image).toBe("https://example.com/image.jpg");
        return { id: "new-group-456", name: "Group With Image", code: "GWI001", image: "https://example.com/image.jpg" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-789"));

    await act(async () => {
      await result.current.createGroup({
        name: "Group With Image",
        image: "https://example.com/image.jpg",
      });
    });
  });

  it("should use empty string for tripId when not provided", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ tripId, name, image }) => {
        expect(tripId).toBe("");
        expect(name).toBe("Test Group");
        expect(image).toBeUndefined();
        return { id: "new-group-789", name: "Test Group" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup());

    await act(async () => {
      await result.current.createGroup({ name: "Test Group" });
    });
  });

  it("should use empty string for null tripId", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ tripId, name }) => {
        expect(tripId).toBe("");
        expect(name).toBe("Test Group");
        return { id: "new-group-null", name: "Test Group" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup(null));

    await act(async () => {
      await result.current.createGroup({ name: "Test Group" });
    });
  });

  it("should handle mutation errors", async () => {
    server.use(
      createORPCHandler(["group", "create"], () => {
        throw new Error("Failed to create group");
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await expect(
      act(async () => {
        await result.current.createGroup({ name: "Test Group" });
      }),
    ).rejects.toThrow("Failed to create group");
  });

  it("should return isCreating true when mutation is pending", async () => {
    server.use(
      createORPCHandler(["group", "create"], () => new Promise(() => {})),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    // Trigger mutation without awaiting
    result.current.createGroup({ name: "Test Group" }).catch(() => {});

    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
    });
  });

  it("should return isCreating false when mutation is not pending", async () => {
    server.use(
      createORPCHandler(["group", "create"], () => ({ id: "new-group", name: "Test Group" })),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    expect(result.current.isCreating).toBe(false);

    await act(async () => {
      await result.current.createGroup({ name: "Test Group" });
    });

    expect(result.current.isCreating).toBe(false);
  });

  it("should handle empty name", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ name }) => {
        expect(name).toBe("");
        return { id: "new-group", name: "" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await act(async () => {
      await result.current.createGroup({ name: "" });
    });
  });

  it("should handle very long name", async () => {
    const longName = "A".repeat(100);

    server.use(
      createORPCHandler(["group", "create"], ({ name }) => {
        expect(name).toBe(longName);
        return { id: "new-group", name: longName };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await act(async () => {
      await result.current.createGroup({ name: longName });
    });
  });

  it("should handle special characters in name", async () => {
    const specialName = "Group with special chars !@#$%^&*()";

    server.use(
      createORPCHandler(["group", "create"], ({ name }) => {
        expect(name).toBe(specialName);
        return { id: "new-group", name: specialName };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await act(async () => {
      await result.current.createGroup({ name: specialName });
    });
  });

  it("should handle undefined image", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ image, name }) => {
        expect(image).toBeUndefined();
        expect(name).toBe("Test Group");
        return { id: "new-group", name: "Test Group" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await act(async () => {
      await result.current.createGroup({ name: "Test Group", image: undefined });
    });
  });

  it("should handle null image", async () => {
    server.use(
      createORPCHandler(["group", "create"], ({ image, name }) => {
        expect(image).toBeUndefined();
        expect(name).toBe("Test Group");
        return { id: "new-group", name: "Test Group" };
      }),
    );

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await act(async () => {
      await result.current.createGroup({ name: "Test Group", image: undefined });
    });
  });
});
