import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  buildAdminGroupQueryInput,
  buildUpdateGroupInput,
  flattenGroupPages,
  getNextAdminGroupPageParam,
  transformRawGroup,
  useAdminGroups,
} from "../../admin/useAdminGroups";

jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateGroupQueries: jest.fn(),
}));

describe("useAdminGroups (MSW)", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return initial loading state", async () => {
    server.use(
      createORPCHandler(
        ["group", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    expect(result.current.groupsLoading).toBe(true);
    expect(result.current.groups).toEqual([]);
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Group A",
        description: "Description A",
        image: "image-a.jpg",
        code: "CODEA",
        coins: 1000,
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        },
        participants: [
          { id: "p1", firstName: "Alice" },
          { id: "p2", firstName: "Bob" },
        ],
      },
      {
        id: "group-2",
        name: "Group B",
        description: null,
        image: null,
        code: "CODEB",
        coins: 500,
        organizer: null,
        participants: [],
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: mockGroups,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]!.id).toBe("group-1");
    expect(result.current.groups[0]!.name).toBe("Group A");
    expect(result.current.groups[0]!.organizer?.firstName).toBe("John");
    expect(result.current.groups[0]!._count.participants).toBe(2);
    expect(result.current.groups[1]!.organizer).toBeNull();
    expect(result.current.groups[1]!._count.participants).toBe(0);
  });

  it("should return users from API", async () => {
    const mockUsers = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "USER" as const,
        wristNumber: "W001",
        houseNumber: "H101",
        group: { id: "group-1", name: "Group A" },
        tripId: "trip-123",
      },
      {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "ADMIN" as const,
        wristNumber: null,
        houseNumber: null,
        group: null,
        tripId: "trip-123",
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => mockUsers),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0]!.id).toBe("user-1");
    expect(result.current.users[0]!.role).toBe("USER");
    expect(result.current.users[1]!.role).toBe("ADMIN");
  });

  it("should create group", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
      createORPCHandler(["group", "create"], ({ name, tripId: t }) => {
        expect(name).toBe("New Group");
        expect(t).toBe(tripId);
        return { id: "group-new", name: "New Group", tripId: t };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createGroup("New Group");
    });
  });

  it("should update group with name only", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
      createORPCHandler(["group", "update"], ({ id, tripId: t, name }) => {
        expect(id).toBe("group-1");
        expect(t).toBe(tripId);
        expect(name).toBe("Updated Group");
        return { id: "group-1", name: "Updated Group" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateGroup("group-1", "Updated Group");
    });
  });

  it("should update group with organizer only", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
      createORPCHandler(["group", "update"], ({ id, tripId: t, organizerId }) => {
        expect(id).toBe("group-1");
        expect(t).toBe(tripId);
        expect(organizerId).toBe("user-2");
        return { id: "group-1", organizerId: "user-2" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateGroup("group-1", undefined, "user-2");
    });
  });

  it("should update group with both name and organizer", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
      createORPCHandler(["group", "update"], ({ id, tripId: t, name, organizerId }) => {
        expect(id).toBe("group-1");
        expect(t).toBe(tripId);
        expect(name).toBe("Updated Group");
        expect(organizerId).toBe("user-2");
        return { id: "group-1", name: "Updated Group", organizerId: "user-2" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateGroup("group-1", "Updated Group", "user-2");
    });
  });

  it("should delete group", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
      createORPCHandler(["group", "delete"], ({ id }) => {
        expect(id).toBe("group-1");
        return { id: "group-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteGroup("group-1");
    });
  });

  it("should indicate loading states for mutations", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
      createORPCHandler(
        ["group", "create"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["group", "update"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["group", "delete"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    // Trigger mutations without awaiting to observe pending state
    result.current.createGroup("New Group").catch(() => {
      /* no-op */
    });
    result.current.updateGroup("group-1", "Updated").catch(() => {
      /* no-op */
    });
    result.current.deleteGroup("group-1").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isCreatingGroup).toBe(true);
      expect(result.current.isUpdatingGroup).toBe(true);
      expect(result.current.isDeletingGroup).toBe(true);
    });
  });

  it("should handle pagination", async () => {
    server.use(
      createORPCHandler(
        ["group", "getAll"],
        ({ pagination }: { pagination?: { offset?: number } }) => {
          const offset = pagination?.offset ?? 0;
          if (offset === 0) {
            return {
              groups: [
                {
                  id: "group-1",
                  name: "Group A",
                  description: null,
                  image: null,
                  code: "CODEA",
                  coins: 100,
                  organizer: null,
                  participants: [],
                },
              ],
              pagination: { hasMore: true, offset: 0, limit: 30 },
            };
          }
          return {
            groups: [],
            pagination: { hasMore: false, offset, limit: 30 },
          };
        },
      ),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groupsHasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchMoreGroups();
    });
  });

  it("should handle refetch", async () => {
    let callCount = 0;

    server.use(
      createORPCHandler(["group", "getAll"], () => {
        callCount++;
        return {
          groups: [
            {
              id: "group-1",
              name: "Group A",
              description: null,
              image: null,
              code: "CODEA",
              coins: 100,
              organizer: null,
              participants: [],
            },
          ],
          pagination: { hasMore: false, offset: 0, limit: 30 },
        };
      }),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(callCount).toBe(1);

    await act(async () => {
      await result.current.refetchGroups();
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  it("should handle refetching state", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groupsRefetching).toBe(false);
  });

  it("should handle fetching next page state", async () => {
    let resolveNextPage: (value: unknown) => void;

    server.use(
      createORPCHandler(
        ["group", "getAll"],
        ({ pagination }: { pagination?: { offset?: number } }) => {
          const offset = pagination?.offset ?? 0;
          if (offset === 0) {
            return {
              groups: [
                {
                  id: "group-1",
                  name: "Group A",
                  description: null,
                  image: null,
                  code: "CODEA",
                  coins: 100,
                  organizer: null,
                  participants: [],
                },
              ],
              pagination: { hasMore: true, offset: 0, limit: 30 },
            };
          }
          return new Promise((resolve) => {
            resolveNextPage = resolve;
          });
        },
      ),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groupsHasNextPage).toBe(true);
    expect(result.current.groupsFetchingNextPage).toBe(false);

    // Trigger fetch next page without awaiting
    result.current.fetchMoreGroups().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.groupsFetchingNextPage).toBe(true);
    });

    resolveNextPage!({
      groups: [],
      pagination: { hasMore: false, offset: 30, limit: 30 },
    });
  });

  it("should flatten multiple pages", async () => {
    server.use(
      createORPCHandler(
        ["group", "getAll"],
        ({ pagination }: { pagination?: { offset?: number } }) => {
          const offset = pagination?.offset ?? 0;
          if (offset === 0) {
            return {
              groups: [
                {
                  id: "group-1",
                  name: "Group A",
                  description: null,
                  image: null,
                  code: "CODEA",
                  coins: 100,
                  organizer: null,
                  participants: [],
                },
              ],
              pagination: { hasMore: true, offset: 0, limit: 30 },
            };
          }
          return {
            groups: [
              {
                id: "group-2",
                name: "Group B",
                description: null,
                image: null,
                code: "CODEB",
                coins: 200,
                organizer: null,
                participants: [],
              },
            ],
            pagination: { hasMore: false, offset, limit: 30 },
          };
        },
      ),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    expect(result.current.groups[0]!.id).toBe("group-1");

    await act(async () => {
      await result.current.fetchMoreGroups();
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2);
    });

    expect(result.current.groups[1]!.id).toBe("group-2");
  });

  it("should return pagination info", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => ({
        groups: [],
        pagination: { hasMore: true, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getAll"], () => []),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groupsPagination).toEqual({
      hasMore: true,
      offset: 0,
      limit: 30,
    });
  });

  it("should be disabled when tripId is empty", async () => {
    server.use(
      createORPCHandler(
        ["group", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminGroups(""));

    // When tripId is empty, the query should be disabled and not loading
    expect(result.current.groupsLoading).toBe(false);
    expect(result.current.groups).toEqual([]);
  });
});

describe("buildAdminGroupQueryInput", () => {
  it("should build query input with valid tripId and pageParam", () => {
    const result = buildAdminGroupQueryInput("trip-123", 30);
    expect(result).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 30 },
    });
  });

  it("should default offset to 0 when pageParam is 0", () => {
    const result = buildAdminGroupQueryInput("trip-123", 0);
    expect(result).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 0 },
    });
  });
});

describe("getNextAdminGroupPageParam", () => {
  it("should return undefined when no more pages", () => {
    const result = getNextAdminGroupPageParam({
      pagination: { hasMore: false, offset: 0, limit: 30 },
    });
    expect(result).toBeUndefined();
  });

  it("should return next offset when more pages exist", () => {
    const result = getNextAdminGroupPageParam({
      pagination: { hasMore: true, offset: 30, limit: 30 },
    });
    expect(result).toBe(60);
  });
});

describe("transformRawGroup", () => {
  it("should transform group with organizer", () => {
    const rawGroup = {
      id: "g1",
      name: "Group A",
      description: "Desc",
      image: "img.jpg",
      code: "CODEA",
      coins: 100,
      organizer: { id: "u1", firstName: "John", lastName: "Doe" },
      participants: [{ id: "p1" }, { id: "p2" }],
    };

    const result = transformRawGroup(rawGroup);

    expect(result).toEqual({
      id: "g1",
      name: "Group A",
      description: "Desc",
      image: "img.jpg",
      code: "CODEA",
      coins: 100,
      organizer: { id: "u1", firstName: "John", lastName: "Doe" },
      _count: { participants: 2 },
    });
  });

  it("should transform group without organizer", () => {
    const rawGroup = {
      id: "g2",
      name: "Group B",
      description: null,
      image: null,
      code: "CODEB",
      coins: 0,
      organizer: null,
      participants: [],
    };

    const result = transformRawGroup(rawGroup);

    expect(result.organizer).toBeNull();
    expect(result._count.participants).toBe(0);
  });
});

describe("flattenGroupPages", () => {
  it("should flatten and transform groups from multiple pages", () => {
    const pages = [
      {
        groups: [
          {
            id: "g1",
            name: "A",
            description: null,
            image: null,
            code: "A",
            coins: 0,
            organizer: null,
            participants: [],
          },
        ],
      },
      {
        groups: [
          {
            id: "g2",
            name: "B",
            description: null,
            image: null,
            code: "B",
            coins: 0,
            organizer: null,
            participants: [],
          },
        ],
      },
    ];

    const result = flattenGroupPages(pages);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe("g1");
    expect(result[1]!.id).toBe("g2");
  });

  it("should handle empty pages", () => {
    expect(flattenGroupPages([])).toEqual([]);
    expect(flattenGroupPages([{}])).toEqual([]);
  });
});

describe("buildUpdateGroupInput", () => {
  it("should include name when provided", () => {
    const result = buildUpdateGroupInput("g1", "trip-1", "New Name", "u1");
    expect(result).toEqual({
      id: "g1",
      tripId: "trip-1",
      name: "New Name",
      organizerId: "u1",
    });
  });

  it("should not include name when undefined", () => {
    const result = buildUpdateGroupInput("g1", "trip-1", undefined, "u1");
    expect(result).toEqual({
      id: "g1",
      tripId: "trip-1",
      organizerId: "u1",
    });
    expect(result).not.toHaveProperty("name");
  });

  it("should include name when empty string", () => {
    const result = buildUpdateGroupInput("g1", "trip-1", "", "u1");
    expect(result).toEqual({
      id: "g1",
      tripId: "trip-1",
      name: "",
      organizerId: "u1",
    });
  });
});
