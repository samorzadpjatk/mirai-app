import { describe, it, expect, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import {
  useGroups,
  useMyGroup,
  useGroupDetails,
  useCreateGroup,
  useGroupEditor,
} from "../../groups";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";

describe("useGroups (MSW)", () => {
  it("should return groups for a trip", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group 1",
        code: "G1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
      {
        id: "group-2",
        name: "Group 2",
        code: "G2",
        image: "img2.jpg",
        participants: [{ id: "p1" }, { id: "p2" }],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]?.id).toBe("group-1");
    expect(result.current.groups[1]?.id).toBe("group-2");
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isFetchingNextPage).toBe(false);
  });

  it("should initialize with empty groups when no tripId", async () => {
    const { result } = renderHookWithMSW(() => useGroups());

    expect(result.current.groups).toEqual([]);
    expect(result.current.filteredGroups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should initialize with empty groups when tripId is null", async () => {
    const { result } = renderHookWithMSW(() => useGroups(null));

    expect(result.current.groups).toEqual([]);
    expect(result.current.filteredGroups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should initialize with empty groups when tripId is empty string", async () => {
    const { result } = renderHookWithMSW(() => useGroups(""));

    expect(result.current.groups).toEqual([]);
    expect(result.current.filteredGroups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should indicate hasNextPage when more pages exist", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group 1",
        code: "G1",
        image: "img1.jpg",
        participants: [],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: true, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("should flatten groups from multiple pages", async () => {
    const page1Groups = [
      {
        id: "group-1",
        name: "Group 1",
        code: "G1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
    ];
    const page2Groups = [
      {
        id: "group-2",
        name: "Group 2",
        code: "G2",
        image: "img2.jpg",
        participants: [{ id: "p2" }],
      },
    ];

    let callCount = 0;
    server.use(
      createORPCHandler(["group", "getAll"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            groups: page1Groups,
            pagination: { hasMore: true, offset: 0, limit: 30 },
          };
        }
        return {
          groups: page2Groups,
          pagination: { hasMore: false, offset: 30, limit: 30 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]?.id).toBe("group-1");
    expect(result.current.groups[1]?.id).toBe("group-2");
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should filter groups by search query", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Alpha Team",
        code: "AT1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
      {
        id: "group-2",
        name: "Beta Squad",
        code: "BS1",
        image: "img2.jpg",
        participants: [{ id: "p1" }, { id: "p2" }],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredGroups).toHaveLength(2);

    act(() => {
      result.current.setSearchQuery("Alpha");
    });

    await waitFor(() => {
      expect(result.current.filteredGroups).toHaveLength(1);
    });

    expect(result.current.filteredGroups[0]).toEqual({
      id: "group-1",
      name: "Alpha Team",
      code: "AT1",
      image: "img1.jpg",
      participantCount: 1,
    });
  });

  it("should return all groups when search query is empty", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Alpha Team",
        code: "AT1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
      {
        id: "group-2",
        name: "Beta Squad",
        code: "BS1",
        image: "img2.jpg",
        participants: [{ id: "p2" }],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery("Alpha");
    });

    await waitFor(() => {
      expect(result.current.filteredGroups).toHaveLength(1);
    });

    act(() => {
      result.current.setSearchQuery("");
    });

    await waitFor(() => {
      expect(result.current.filteredGroups).toHaveLength(2);
    });
  });

  it("should return empty filteredGroups when search has no matches", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Alpha Team",
        code: "AT1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery("Zebra");
    });

    await waitFor(() => {
      expect(result.current.filteredGroups).toEqual([]);
    });
  });

  it("should map groups to GroupListItem with participantCount", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Solo Group",
        code: "SG1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
      {
        id: "group-2",
        name: "Big Group",
        code: "BG1",
        image: "img2.jpg",
        participants: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredGroups[0]).toEqual({
      id: "group-1",
      name: "Solo Group",
      code: "SG1",
      image: "img1.jpg",
      participantCount: 1,
    });
    expect(result.current.filteredGroups[1]).toEqual({
      id: "group-2",
      name: "Big Group",
      code: "BG1",
      image: "img2.jpg",
      participantCount: 3,
    });
  });

  it("should handle empty groups response", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups).toEqual([]);
    expect(result.current.filteredGroups).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should expose refetch function", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group 1",
        code: "G1",
        image: "img1.jpg",
        participants: [],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");
  });

  it("should show loading state while fetching", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group 1",
        code: "G1",
        image: "img1.jpg",
        participants: [],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useGroups("trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.groups).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(1);
  });
});

describe("useMyGroup (MSW)", () => {
  it("should return group data when API returns data", async () => {
    const mockGroup = {
      id: "group-123",
      name: "My Awesome Group",
      code: "MAG001",
      image: "https://example.com/group.jpg",
      participants: [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob" },
      ],
      trip: { id: "trip-123", name: "Summer Trip" },
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.error).toBeNull();
  });

  it("should return null when user has no group", async () => {
    server.use(createORPCHandler(["group", "getMy"], () => null));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is null", async () => {
    const { result } = renderHookWithMSW(() => useMyGroup(null));

    expect(result.current.group).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is undefined", async () => {
    const { result } = renderHookWithMSW(() => useMyGroup(undefined));

    expect(result.current.group).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is empty string", async () => {
    const { result } = renderHookWithMSW(() => useMyGroup(""));

    expect(result.current.group).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockGroup = {
      id: "group-123",
      name: "My Group",
      code: "MG001",
      image: "group.jpg",
      participants: [],
      trip: { id: "trip-123", name: "Trip" },
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.group).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
  });
});

describe("useGroupDetails (MSW)", () => {
  it("should return group and current user data when API returns data", async () => {
    const mockUser = { id: "user-1", name: "John Doe", email: "john@example.com" };
    const mockGroup = {
      id: "group-123",
      name: "Test Group",
      code: "TG123",
      image: "group.jpg",
      participants: [{ id: "user-1", name: "John" }],
      trip: { id: "trip-1", name: "Summer Trip" },
    };

    server.use(
      createORPCHandler(["user", "getMy"], () => mockUser),
      createORPCHandler(["group", "getById"], () => mockGroup),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-123"));

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.isLoadingUser).toBe(false);
  });

  it("should return undefined group when groupId is null", async () => {
    const mockUser = { id: "user-1", name: "John" };

    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useGroupDetails(null));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.group).toBeUndefined();
    expect(result.current.isLoadingGroup).toBe(false);
    expect(result.current.currentUser).toEqual(mockUser);
  });

  it("should return undefined group when groupId is undefined", async () => {
    const mockUser = { id: "user-1", name: "John" };

    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useGroupDetails(undefined));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.group).toBeUndefined();
    expect(result.current.isLoadingGroup).toBe(false);
  });

  it("should return undefined group when groupId is empty string", async () => {
    const mockUser = { id: "user-1", name: "John" };

    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useGroupDetails(""));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.group).toBeUndefined();
    expect(result.current.isLoadingGroup).toBe(false);
    expect(result.current.currentUser).toEqual(mockUser);
  });

  it("should handle loading states while fetching", async () => {
    const mockUser = { id: "user-1", name: "John" };
    const mockGroup = {
      id: "group-123",
      name: "Test Group",
      code: "TG123",
      image: "group.jpg",
      participants: [],
      trip: { id: "trip-1", name: "Summer Trip" },
    };

    server.use(
      createORPCHandler(["user", "getMy"], () => mockUser),
      createORPCHandler(["group", "getById"], () => mockGroup),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-123"));

    expect(result.current.isLoadingUser).toBe(true);
    expect(result.current.isLoadingGroup).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.currentUser).toEqual(mockUser);
  });

  it("should handle both APIs returning null", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => null),
      createORPCHandler(["group", "getById"], () => null),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-123"));

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.group).toBeNull();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isLoadingUser).toBe(false);
  });
});

describe("useCreateGroup (MSW)", () => {
  it("should create group via mutation", async () => {
    const createdGroup = {
      id: "new-group",
      name: "New Group",
      image: "group.jpg",
      tripId: "trip-123",
    };

    server.use(createORPCHandler(["group", "create"], () => createdGroup));

    const { result } = renderHookWithMSW(() => useCreateGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });

    const response = await result.current.createGroup({
      name: "New Group",
      image: "group.jpg",
    });

    expect(response).toEqual(createdGroup);
  });

  it("should create group with fallback tripId when none provided", async () => {
    const createdGroup = {
      id: "new-group",
      name: "New Group",
      tripId: "",
    };

    server.use(createORPCHandler(["group", "create"], () => createdGroup));

    const { result } = renderHookWithMSW(() => useCreateGroup());

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });

    const response = await result.current.createGroup({
      name: "New Group",
    });

    expect(response).toEqual(createdGroup);
  });
});

describe("useGroupEditor (MSW)", () => {
  beforeEach(() => {
    server.use(
      createORPCHandler(["group", "getById"], () => ({
        id: "group-123",
        name: "Test Group",
        code: "TG123",
        image: "group.jpg",
        participants: [],
        trip: { id: "trip-1", name: "Summer Trip" },
      })),
    );
  });

  it("should return group data and loading state", async () => {
    const { result } = renderHookWithMSW(() => useGroupEditor("group-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toBeDefined();
    expect(result.current.group?.id).toBe("group-123");
  });

  it("should not fetch group when groupId is null", async () => {
    const { result } = renderHookWithMSW(() => useGroupEditor(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.group).toBeUndefined();
  });

  it("should update group via updateGroup action", async () => {
    const updatedGroup = {
      id: "group-123",
      name: "Updated Group",
      tripId: "trip-1",
    };

    server.use(createORPCHandler(["group", "update"], () => updatedGroup));

    const { result } = renderHookWithMSW(() => useGroupEditor("group-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const response = await result.current.updateGroup({
      id: "group-123",
      name: "Updated Group",
    });

    expect(response).toEqual(updatedGroup);
  });

  it("should assign user to group via assignUser action", async () => {
    server.use(createORPCHandler(["group", "assignUserToGroup"], () => ({ success: true })));

    const { result } = renderHookWithMSW(() => useGroupEditor("group-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const response = await result.current.assignUser("user-1", "trip-1");

    expect(response).toEqual({ success: true });
  });

  it("should remove user from group via removeUser action", async () => {
    server.use(createORPCHandler(["group", "removeUserFromGroup"], () => ({ success: true })));

    const { result } = renderHookWithMSW(() => useGroupEditor("group-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const response = await result.current.removeUser("user-1");

    expect(response).toEqual({ success: true });
  });

  it("should throw when updating group without tripId", async () => {
    server.use(
      createORPCHandler(["group", "getById"], () => ({
        id: "group-123",
        name: "Test Group",
        code: "TG123",
        image: "group.jpg",
        participants: [],
        trip: null,
      })),
    );

    const { result } = renderHookWithMSW(() => useGroupEditor("group-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.updateGroup({ id: "group-123", name: "Updated" })).rejects.toThrow(
      "Missing tripId for updateGroup",
    );
  });

  it("should throw when removing user without tripId", async () => {
    server.use(
      createORPCHandler(["group", "getById"], () => ({
        id: "group-123",
        name: "Test Group",
        code: "TG123",
        image: "group.jpg",
        participants: [{ id: "user-1" }],
        trip: null,
      })),
    );

    const { result } = renderHookWithMSW(() => useGroupEditor("group-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.removeUser("user-1")).rejects.toThrow(
      "Missing tripId for removeUser",
    );
  });
});
