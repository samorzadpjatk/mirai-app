import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useGroupEditor } from "../../groups/useGroupEditor";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockUseTRPC = jest.fn();
const mockInvalidateGroupQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: () => mockUseTRPC(),
}));

jest.mock("@mirai-app/trpc/client/query", () => ({
  invalidateGroupQueries: (...args: unknown[]) => mockInvalidateGroupQueries(...args),
}));

describe("useGroupEditor", () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
  };

  const mockTrpc = {
    group: {
      getById: {
        queryOptions: jest.fn((params: { id: string } | undefined, options: Record<string, unknown> | undefined) => ({
          queryKey: ["group", "getById", params?.id],
          ...options,
        })),
      },
      update: {
        mutationOptions: jest.fn((options: Record<string, unknown>) => ({
          mutationKey: ["group", "update"],
          ...options,
        })),
      },
      assignUserToGroup: {
        mutationOptions: jest.fn((options: Record<string, unknown>) => ({
          mutationKey: ["group", "assignUserToGroup"],
          ...options,
        })),
      },
      removeUserFromGroup: {
        mutationOptions: jest.fn((options: Record<string, unknown>) => ({
          mutationKey: ["group", "removeUserFromGroup"],
          ...options,
        })),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue(mockQueryClient);
    mockUseTRPC.mockReturnValue(mockTrpc);
  });

  describe("query initialization", () => {
    it("should fetch group data when groupId is provided", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      renderHook(() => useGroupEditor("group-123"));

      expect(mockTrpc.group.getById.queryOptions).toHaveBeenCalledWith(
        { id: "group-123" },
        { enabled: true }
      );
    });

    it("should disable query when groupId is null", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      renderHook(() => useGroupEditor(null));

      expect(mockTrpc.group.getById.queryOptions).toHaveBeenCalledWith(
        { id: "" },
        { enabled: false }
      );
    });

    it("should disable query when groupId is undefined", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      renderHook(() => useGroupEditor(undefined));

      expect(mockTrpc.group.getById.queryOptions).toHaveBeenCalledWith(
        { id: "" },
        { enabled: false }
      );
    });
  });

  describe("group data", () => {
    it("should return group data from query", () => {
      const mockGroup = {
        id: "group-123",
        name: "Test Group",
        code: "TG001",
        image: "group.jpg",
        participants: [{ id: "user-1", name: "John" }],
        trip: { id: "trip-1", name: "Summer Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      expect(result.current.group).toEqual(mockGroup);
    });

    it("should return undefined when group data is not available", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      expect(result.current.group).toBeUndefined();
    });
  });

  describe("loading states", () => {
    it("should return isLoading true when group query is loading", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading false when group query is complete", () => {
      mockUseQuery.mockReturnValue({
        data: { id: "group-123", name: "Test" },
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      expect(result.current.isLoading).toBe(false);
    });

    it("should return isUpdating true when update mutation is pending", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      expect(result.current.isUpdating).toBe(true);
    });

    it("should return isUpdating false when update mutation is not pending", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe("updateGroup", () => {
    it("should update group with provided data", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ id: "group-123", name: "Updated Name" });
      const mockGroup = {
        id: "group-123",
        name: "Original Name",
        trip: { id: "trip-1", name: "Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await result.current.updateGroup({
        id: "group-123",
        name: "Updated Name",
        image: "new-image.jpg",
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "group-123",
        name: "Updated Name",
        image: "new-image.jpg",
        tripId: "trip-1",
      });
    });

    it("should use tripId from group data when not provided", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ id: "group-123" });
      const mockGroup = {
        id: "group-123",
        name: "Test",
        trip: { id: "trip-1", name: "Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await result.current.updateGroup({ id: "group-123", name: "New Name" });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "group-123",
        name: "New Name",
        tripId: "trip-1",
      });
    });

    it("should use provided tripId over group data tripId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ id: "group-123" });
      const mockGroup = {
        id: "group-123",
        name: "Test",
        trip: { id: "trip-1", name: "Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await result.current.updateGroup({
        id: "group-123",
        name: "New Name",
        tripId: "trip-2",
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "group-123",
        name: "New Name",
        tripId: "trip-2",
      });
    });

    it("should throw error when tripId is missing and group has no trip", async () => {
      const mockGroup = {
        id: "group-123",
        name: "Test",
        trip: null,
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await expect(result.current.updateGroup({ id: "group-123", name: "New Name" }))
        .rejects.toThrow("Missing tripId for updateGroup");
    });

    it("should throw error when group data is not loaded", async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await expect(result.current.updateGroup({ id: "group-123", name: "New Name" }))
        .rejects.toThrow("Missing tripId for updateGroup");
    });
  });

  describe("assignUser", () => {
    it("should assign user to group", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

      mockUseQuery.mockReturnValue({
        data: { id: "group-123", name: "Test Group" },
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await result.current.assignUser("user-456", "trip-789");

      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: "user-456",
        tripId: "trip-789",
        groupId: "group-123",
      });
    });

    it("should use empty string for groupId when not provided", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor());

      await result.current.assignUser("user-456", "trip-789");

      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: "user-456",
        tripId: "trip-789",
        groupId: "",
      });
    });
  });

  describe("removeUser", () => {
    it("should remove user from group", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });
      const mockGroup = {
        id: "group-123",
        name: "Test Group",
        trip: { id: "trip-1", name: "Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await result.current.removeUser("user-456");

      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: "user-456",
        tripId: "trip-1",
      });
    });

    it("should throw error when tripId is missing", async () => {
      const mockGroup = {
        id: "group-123",
        name: "Test Group",
        trip: null,
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await expect(result.current.removeUser("user-456"))
        .rejects.toThrow("Missing tripId for removeUser");
    });

    it("should throw error when group data is not loaded", async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useGroupEditor("group-123"));

      await expect(result.current.removeUser("user-456"))
        .rejects.toThrow("Missing tripId for removeUser");
    });
  });

  describe("mutation success callbacks", () => {
    it("should invalidate group queries after update success", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({ id: "group-123" });
      const mockGroup = {
        id: "group-123",
        name: "Test",
        trip: { id: "trip-1", name: "Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
      });

      let onSuccessCallback: (() => Promise<void>) | null = null;
      mockUseMutation.mockImplementation((options: { onSuccess?: () => Promise<void> }) => {
        onSuccessCallback = options?.onSuccess ?? null;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      renderHook(() => useGroupEditor("group-123"));

      if (onSuccessCallback) {
        await onSuccessCallback();
      }

      expect(mockInvalidateGroupQueries).toHaveBeenCalledWith(mockQueryClient);
    });

    it("should invalidate group queries after assign success", async () => {
      let onSuccessCallback: (() => Promise<void>) | null = null;

      mockUseQuery.mockReturnValue({
        data: { id: "group-123", name: "Test" },
        isLoading: false,
      });

      mockUseMutation.mockImplementation((options: { onSuccess?: () => Promise<void> }) => {
        onSuccessCallback = options?.onSuccess ?? null;
        return {
          mutateAsync: jest.fn().mockResolvedValue({ success: true }),
          isPending: false,
        };
      });

      renderHook(() => useGroupEditor("group-123"));

      if (onSuccessCallback) {
        await onSuccessCallback();
      }

      expect(mockInvalidateGroupQueries).toHaveBeenCalledWith(mockQueryClient);
    });

    it("should invalidate group queries after remove success", async () => {
      let onSuccessCallback: (() => Promise<void>) | null = null;

      mockUseQuery.mockReturnValue({
        data: { id: "group-123", name: "Test", trip: { id: "trip-1" } },
        isLoading: false,
      });

      mockUseMutation.mockImplementation((options: { onSuccess?: () => Promise<void> }) => {
        onSuccessCallback = options?.onSuccess ?? null;
        return {
          mutateAsync: jest.fn().mockResolvedValue({ success: true }),
          isPending: false,
        };
      });

      renderHook(() => useGroupEditor("group-123"));

      if (onSuccessCallback) {
        await onSuccessCallback();
      }

      expect(mockInvalidateGroupQueries).toHaveBeenCalledWith(mockQueryClient);
    });
  });
});
