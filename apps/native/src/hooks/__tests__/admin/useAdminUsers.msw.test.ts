import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import {
  useAdminUsers,
  buildUserSearchQueryInput,
  getNextUserSearchPageParam,
  normalizeSearchTerm,
  normalizeUserName,
  shouldUpdateIdentifier,
} from "../../admin/useAdminUsers";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateUserQueries: jest.fn(),
}));

describe("useAdminUsers (MSW)", () => {
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
        ["user", "searchWithPagination"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    expect(result.current.usersLoading).toBe(true);
    expect(result.current.users).toEqual([]);
  });

  it("should return users from API", async () => {
    const mockUsers = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "USER" as const,
        tripId: "trip-123",
      },
      {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "ADMIN" as const,
        tripId: "trip-123",
        group: { id: "group-1", name: "Group A" },
      },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: mockUsers,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(2);
    expect(result.current.users[0]!.id).toBe("user-1");
    expect(result.current.users[1]!.role).toBe("ADMIN");
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      { id: "group-1", name: "Group A" },
      { id: "group-2", name: "Group B" },
    ];

    server.use(
      createORPCHandler(["group", "getAll"], () => mockGroups),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0]!.name).toBe("Group A");
  });

  it("should assign user to group", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["group", "assignUserToGroup"], ({ userId, groupId, tripId: t }) => {
        expect(userId).toBe("user-1");
        expect(groupId).toBe("group-1");
        expect(t).toBe(tripId);
        return { id: "assignment-1", userId, groupId, tripId: t };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.assignToGroup("user-1", "group-1");
    });
  });

  it("should remove user from group", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["group", "removeUserFromGroup"], ({ userId, tripId: t }) => {
        expect(userId).toBe("user-1");
        expect(t).toBe(tripId);
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeFromGroup("user-1");
    });
  });

  it("should create user", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "createUser"], ({ tripId: t, firstName, lastName, email }) => {
        expect(t).toBe(tripId);
        expect(firstName).toBe("New");
        expect(lastName).toBe("User");
        expect(email).toBe("new@example.com");
        return { id: "user-new", firstName, lastName, email, tripId: t };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createUser({
        tripId: "trip-123",
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
      });
    });
  });

  it("should ban user", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "banUserUntil"], ({ userId, bannedUntilMs, reason }) => {
        expect(userId).toBe("user-1");
        expect(typeof bannedUntilMs).toBe("number");
        expect(reason).toBe("Violation");
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.banUserUntil({
        userId: "user-1",
        bannedUntilMs: Date.now() + 86400000,
        reason: "Violation",
      });
    });
  });

  it("should delete user", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "deleteUser"], ({ userId, tripId: t }) => {
        expect(userId).toBe("user-1");
        expect(t).toBe(tripId);
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteUser({
        userId: "user-1",
        tripId: "trip-123",
      });
    });
  });

  it("should update user name with trimmed values", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "updateName"], ({ userId, firstName, lastName }) => {
        expect(userId).toBe("user-1");
        expect(firstName).toBe("John");
        expect(lastName).toBe("Doe");
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateName({
        userId: "user-1",
        firstName: "  John  ",
        lastName: "  Doe  ",
      });
    });
  });

  it("should update wrist number", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "updateWristNumber"], ({ userId, tripId: t, wristNumber }) => {
        expect(userId).toBe("user-1");
        expect(t).toBe(tripId);
        expect(wristNumber).toBe("W123");
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateWristNumber("user-1", "W123");
    });
  });

  it("should remove wrist number when empty string provided", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "removeWristNumber"], ({ userId, tripId: t }) => {
        expect(userId).toBe("user-1");
        expect(t).toBe(tripId);
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateWristNumber("user-1", "   ");
    });
  });

  it("should update house number", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "updateHouseNumber"], ({ userId, tripId: t, houseNumber }) => {
        expect(userId).toBe("user-1");
        expect(t).toBe(tripId);
        expect(houseNumber).toBe("H456");
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateHouseNumber("user-1", "H456");
    });
  });

  it("should remove house number when empty string provided", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "removeHouseNumber"], ({ userId, tripId: t }) => {
        expect(userId).toBe("user-1");
        expect(t).toBe(tripId);
        return undefined;
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateHouseNumber("user-1", "   ");
    });
  });

  it("should indicate loading states for mutations", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(
        ["group", "assignUserToGroup"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["group", "removeUserFromGroup"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "createUser"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "banUserUntil"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "deleteUser"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "updateName"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "updateWristNumber"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "removeWristNumber"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "updateHouseNumber"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["user", "removeHouseNumber"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    // Trigger mutations without awaiting to observe pending state
    result.current.assignToGroup("user-1", "group-1").catch(() => {
      /* no-op */
    });
    result.current.removeFromGroup("user-1").catch(() => {
      /* no-op */
    });
    result.current
      .createUser({ tripId, firstName: "New", lastName: "User", email: "new@example.com" })
      .catch(() => {
        /* no-op */
      });
    result.current
      .banUserUntil({ userId: "user-1", bannedUntilMs: Date.now() + 86400000 })
      .catch(() => {
        /* no-op */
      });
    result.current.deleteUser({ userId: "user-1", tripId }).catch(() => {
      /* no-op */
    });
    result.current
      .updateName({ userId: "user-1", firstName: "John", lastName: "Doe" })
      .catch(() => {
        /* no-op */
      });
    result.current.updateWristNumber("user-1", "W123").catch(() => {
      /* no-op */
    });
    result.current.updateWristNumber("user-1", "   ").catch(() => {
      /* no-op */
    });
    result.current.updateHouseNumber("user-1", "H456").catch(() => {
      /* no-op */
    });
    result.current.updateHouseNumber("user-1", "   ").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isAssigningToGroup).toBe(true);
      expect(result.current.isRemovingFromGroup).toBe(true);
      expect(result.current.isCreatingUser).toBe(true);
      expect(result.current.isBanningUser).toBe(true);
      expect(result.current.isDeletingUser).toBe(true);
      expect(result.current.isUpdatingName).toBe(true);
      expect(result.current.isUpdatingWristNumber).toBe(true);
      expect(result.current.isRemovingWristNumber).toBe(true);
      expect(result.current.isUpdatingHouseNumber).toBe(true);
      expect(result.current.isRemovingHouseNumber).toBe(true);
    });
  });

  it("should handle pagination", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], ({ pagination }) => {
        const offset = pagination?.offset ?? 0;
        if (offset === 0) {
          return {
            users: [
              {
                id: "user-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                role: "USER",
                tripId: "trip-123",
              },
            ],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          };
        }
        return {
          users: [],
          pagination: { hasMore: false, offset, limit: 30 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.usersHasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchMoreUsers();
    });

    await waitFor(() => {
      expect(result.current.usersHasNextPage).toBe(false);
    });
  });

  it("should handle refetch", async () => {
    let callCount = 0;

    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => {
        callCount++;
        return {
          users: [],
          pagination: { hasMore: false, offset: 0, limit: 30 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(callCount).toBe(1);

    await act(async () => {
      await result.current.refetchUsers();
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  it("should handle refetching state", async () => {
    let resolveRefetch: (value: unknown) => void;

    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.usersRefetching).toBe(false);

    // Override handler to simulate slow refetch
    server.use(
      createORPCHandler(
        ["user", "searchWithPagination"],
        () =>
          new Promise((resolve) => {
            resolveRefetch = resolve;
          }),
      ),
    );

    result.current.refetchUsers().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.usersRefetching).toBe(true);
    });

    resolveRefetch!({
      users: [],
      pagination: { hasMore: false, offset: 0, limit: 30 },
    });
  });

  it("should handle search/filter", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], ({ searchTerm, field }) => {
        if (searchTerm === "John" && field === "firstName") {
          return {
            users: [
              {
                id: "user-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                role: "USER",
                tripId: "trip-123",
              },
            ],
            pagination: { hasMore: false, offset: 0, limit: 30 },
          };
        }
        return {
          users: [],
          pagination: { hasMore: false, offset: 0, limit: 30 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "John", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0]!.firstName).toBe("John");
  });

  it("should handle fetching next page state", async () => {
    let resolveNextPage: (value: unknown) => void;

    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], ({ pagination }) => {
        const offset = pagination?.offset ?? 0;
        if (offset === 0) {
          return {
            users: [
              {
                id: "user-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                role: "USER",
                tripId: "trip-123",
              },
            ],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          };
        }
        return new Promise((resolve) => {
          resolveNextPage = resolve;
        });
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.usersHasNextPage).toBe(true);
    expect(result.current.usersFetchingNextPage).toBe(false);

    // Trigger fetch next page without awaiting
    result.current.fetchMoreUsers().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.usersFetchingNextPage).toBe(true);
    });

    resolveNextPage!({
      users: [],
      pagination: { hasMore: false, offset: 30, limit: 30 },
    });
  });

  it("should flatten multiple pages", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], ({ pagination }) => {
        const offset = pagination?.offset ?? 0;
        if (offset === 0) {
          return {
            users: [
              {
                id: "user-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                role: "USER",
                tripId: "trip-123",
              },
            ],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          };
        }
        return {
          users: [
            {
              id: "user-2",
              firstName: "Jane",
              lastName: "Smith",
              email: "jane@example.com",
              role: "ADMIN",
              tripId: "trip-123",
            },
          ],
          pagination: { hasMore: false, offset, limit: 30 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });

    expect(result.current.users[0]!.id).toBe("user-1");

    await act(async () => {
      await result.current.fetchMoreUsers();
    });

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
    });

    expect(result.current.users[1]!.id).toBe("user-2");
  });

  it("should return pagination info", async () => {
    server.use(
      createORPCHandler(["group", "getAll"], () => []),
      createORPCHandler(["user", "searchWithPagination"], () => ({
        users: [],
        pagination: { hasMore: true, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers(tripId, "", "firstName"));

    await waitFor(() => {
      expect(result.current.usersLoading).toBe(false);
    });

    expect(result.current.usersPagination).toEqual({
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
        ["user", "searchWithPagination"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminUsers("", "", "firstName"));

    // When tripId is empty, the infinite query is disabled and not loading
    expect(result.current.usersLoading).toBe(false);
    expect(result.current.users).toEqual([]);
  });
});

describe("buildUserSearchQueryInput", () => {
  it("should build query input with valid parameters", () => {
    const result = buildUserSearchQueryInput("trip-123", "firstName", "John", 30);
    expect(result).toEqual({
      tripId: "trip-123",
      field: "firstName",
      searchTerm: "John",
      pagination: { limit: 30, offset: 30 },
    });
  });

  it("should omit searchTerm when empty", () => {
    const result = buildUserSearchQueryInput("trip-123", "firstName", "", 0);
    expect(result.searchTerm).toBeUndefined();
    expect(result).toEqual({
      tripId: "trip-123",
      field: "firstName",
      pagination: { limit: 30, offset: 0 },
    });
  });
});

describe("getNextUserSearchPageParam", () => {
  it("should return undefined when no more pages", () => {
    const result = getNextUserSearchPageParam({
      pagination: { hasMore: false, offset: 0, limit: 30 },
    });
    expect(result).toBeUndefined();
  });

  it("should return next offset when more pages exist", () => {
    const result = getNextUserSearchPageParam({
      pagination: { hasMore: true, offset: 30, limit: 30 },
    });
    expect(result).toBe(60);
  });
});

describe("normalizeSearchTerm", () => {
  it("should trim leading and trailing whitespace", () => {
    expect(normalizeSearchTerm("  hello  ")).toBe("hello");
  });

  it("should handle empty string", () => {
    expect(normalizeSearchTerm("")).toBe("");
  });

  it("should handle already clean string", () => {
    expect(normalizeSearchTerm("john")).toBe("john");
  });
});

describe("normalizeUserName", () => {
  it("should trim both first and last names", () => {
    const result = normalizeUserName("  John  ", "  Doe  ");
    expect(result).toEqual({ firstName: "John", lastName: "Doe" });
  });

  it("should handle empty strings", () => {
    const result = normalizeUserName("", "");
    expect(result).toEqual({ firstName: "", lastName: "" });
  });
});

describe("shouldUpdateIdentifier", () => {
  it("should return true for non-empty string", () => {
    expect(shouldUpdateIdentifier("W123")).toBe(true);
    expect(shouldUpdateIdentifier("  W123  ")).toBe(true);
  });

  it("should return false for empty string", () => {
    expect(shouldUpdateIdentifier("")).toBe(false);
  });

  it("should return false for whitespace-only string", () => {
    expect(shouldUpdateIdentifier("   ")).toBe(false);
  });
});
