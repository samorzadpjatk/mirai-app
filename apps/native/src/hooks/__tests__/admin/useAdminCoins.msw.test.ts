import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import { useAdminCoins } from "../../admin/useAdminCoins";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

describe("useAdminCoins (MSW)", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => new Promise(() => {})),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    expect(result.current.groupsLoading).toBe(true);
    expect(result.current.groups).toEqual([]);
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group A",
        coins: 1000,
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        _count: { participants: 10 },
      },
      {
        id: "group-2",
        name: "Group B",
        coins: 500,
        organizer: null,
        _count: { participants: 5 },
      },
    ];

    server.use(
      createORPCHandler(["group", "getGroupList"], () => mockGroups),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]!.id).toBe("group-1");
    expect(result.current.groups[0]!.name).toBe("Group A");
    expect(result.current.groups[0]!.coins).toBe(1000);
    expect(result.current.groups[0]!.organizer?.firstName).toBe("John");
    expect(result.current.groups[0]!._count.participants).toBe(10);
  });

  it("should add coins to group", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
      createORPCHandler(["group", "addCoins"], ({ groupId, amount, tripId: t }) => {
        expect(groupId).toBe("group-1");
        expect(amount).toBe(100);
        expect(t).toBe(tripId);
        return { id: "transaction-1", groupId, amount };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addCoins("group-1", 100, "Bonus for winning");
    });
  });

  it("should remove coins from group", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
      createORPCHandler(["group", "addCoins"], ({ groupId, amount, tripId: t }) => {
        expect(groupId).toBe("group-1");
        expect(amount).toBe(-50);
        expect(t).toBe(tripId);
        return { id: "transaction-1", groupId, amount };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeCoins("group-1", 50, "Penalty");
    });
  });

  it("should throw error when adding non-positive amount", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addCoins("group-1", 0, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for adding coins");

    await expect(
      act(async () => {
        await result.current.addCoins("group-1", -10, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for adding coins");
  });

  it("should throw error when removing non-positive amount", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.removeCoins("group-1", 0, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for removing coins");

    await expect(
      act(async () => {
        await result.current.removeCoins("group-1", -10, "Invalid");
      }),
    ).rejects.toThrow("Amount must be positive for removing coins");
  });

  it("should indicate loading state for mutations", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
      createORPCHandler(["group", "addCoins"], () => new Promise(() => {})),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    // Trigger mutation without awaiting to observe pending state
    result.current.addCoins("group-1", 100, "Bonus").catch(() => {});

    await waitFor(() => {
      expect(result.current.isAddingCoins).toBe(true);
      expect(result.current.isRemovingCoins).toBe(true);
    });
  });

  it("should handle empty groups list", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
  });

  it("should handle null data from query", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => null),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
  });

  it("should handle group without organizer", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group A",
        coins: 1000,
        organizer: null,
        _count: { participants: 10 },
      },
    ];

    server.use(
      createORPCHandler(["group", "getGroupList"], () => mockGroups),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups[0]!.organizer).toBeNull();
  });

  it("should accept reason parameter (unused but in interface)", async () => {
    server.use(
      createORPCHandler(["group", "getGroupList"], () => []),
      createORPCHandler(["group", "addCoins"], ({ groupId, amount, tripId: t }) => {
        expect(groupId).toBe("group-1");
        expect(amount).toBe(100);
        expect(t).toBe(tripId);
        return { id: "transaction-1", groupId, amount };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminCoins(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addCoins("group-1", 100, "This is the reason");
    });
  });
});
