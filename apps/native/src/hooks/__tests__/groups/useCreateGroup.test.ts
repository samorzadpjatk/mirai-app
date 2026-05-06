import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useCreateGroup } from "../../groups/useCreateGroup";

const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockUseTRPC = jest.fn();
const mockInvalidateGroupQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: () => mockUseTRPC(),
}));

jest.mock("@mirai-app/trpc/client/query", () => ({
  invalidateGroupQueries: (...args: unknown[]) => mockInvalidateGroupQueries(...args),
}));

describe("useCreateGroup", () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
  };

  const mockTrpc = {
    group: {
      create: {
        mutationOptions: jest.fn((options: Record<string, unknown>) => ({
          mutationKey: ["group", "create"],
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

  describe("mutation initialization", () => {
    it("should initialize create group mutation", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      renderHook(() => useCreateGroup("trip-123"));

      expect(mockTrpc.group.create.mutationOptions).toHaveBeenCalled();
      expect(mockUseMutation).toHaveBeenCalled();
    });

    it("should handle undefined tripId", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup());

      expect(typeof result.current.createGroup).toBe("function");
      expect(result.current.isCreating).toBe(false);
    });

    it("should handle null tripId", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup(null));

      expect(typeof result.current.createGroup).toBe("function");
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("createGroup function", () => {
    it("should create group with name only", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group-123",
        name: "New Group",
        code: "NG001",
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-456"));

      const groupResult = await result.current.createGroup({ name: "New Group" });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-456",
        name: "New Group",
        image: undefined,
      });
      expect(groupResult).toEqual({
        id: "new-group-123",
        name: "New Group",
        code: "NG001",
      });
    });

    it("should create group with name and image", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group-456",
        name: "Group With Image",
        code: "GWI001",
        image: "https://example.com/image.jpg",
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-789"));

      await result.current.createGroup({
        name: "Group With Image",
        image: "https://example.com/image.jpg",
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-789",
        name: "Group With Image",
        image: "https://example.com/image.jpg",
      });
    });

    it("should use empty string for tripId when not provided", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group-789",
        name: "Test Group",
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup());

      await result.current.createGroup({ name: "Test Group" });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "",
        name: "Test Group",
        image: undefined,
      });
    });

    it("should handle mutation errors", async () => {
      const mockError = new Error("Failed to create group");
      const mockMutateAsync = jest.fn().mockRejectedValue(mockError);

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      await expect(result.current.createGroup({ name: "Test Group" }))
        .rejects.toThrow("Failed to create group");
    });
  });

  describe("isCreating state", () => {
    it("should return isCreating true when mutation is pending", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      expect(result.current.isCreating).toBe(true);
    });

    it("should return isCreating false when mutation is not pending", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("mutation success callback", () => {
    it("should invalidate group queries after successful creation", async () => {
      let onSuccessCallback: (() => Promise<void>) | null = null;

      mockUseMutation.mockImplementation((options: { onSuccess?: () => Promise<void> }) => {
        onSuccessCallback = options?.onSuccess ?? null;
        return {
          mutateAsync: jest.fn().mockResolvedValue({ id: "new-group" }),
          isPending: false,
        };
      });

      renderHook(() => useCreateGroup("trip-123"));

      if (onSuccessCallback) {
        await onSuccessCallback();
      }

      expect(mockInvalidateGroupQueries).toHaveBeenCalledWith(mockQueryClient);
    });

    it("should invalidate queries with correct queryClient", async () => {
      let onSuccessCallback: (() => Promise<void>) | null = null;

      mockUseMutation.mockImplementation((options: { onSuccess?: () => Promise<void> }) => {
        onSuccessCallback = options?.onSuccess ?? null;
        return {
          mutateAsync: jest.fn().mockResolvedValue({ id: "new-group" }),
          isPending: false,
        };
      });

      renderHook(() => useCreateGroup("trip-123"));

      if (onSuccessCallback) {
        await onSuccessCallback();
      }

      expect(mockInvalidateGroupQueries).toHaveBeenCalledTimes(1);
      expect(mockInvalidateGroupQueries).toHaveBeenCalledWith(mockQueryClient);
    });
  });

  describe("form state management", () => {
    it("should expose createGroup function", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      expect(typeof result.current.createGroup).toBe("function");
    });

    it("should expose isCreating boolean", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      expect(typeof result.current.isCreating).toBe("boolean");
    });

    it("should return consistent interface", () => {
      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      expect(result.current).toHaveProperty("createGroup");
      expect(result.current).toHaveProperty("isCreating");
      expect(Object.keys(result.current)).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty name", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group",
        name: "",
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      await result.current.createGroup({ name: "" });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-123",
        name: "",
        image: undefined,
      });
    });

    it("should handle very long name", async () => {
      const longName = "A".repeat(100);
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group",
        name: longName,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      await result.current.createGroup({ name: longName });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-123",
        name: longName,
        image: undefined,
      });
    });

    it("should handle special characters in name", async () => {
      const specialName = "Group with special chars";
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group",
        name: specialName,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      await result.current.createGroup({ name: specialName });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-123",
        name: specialName,
        image: undefined,
      });
    });

    it("should handle undefined image", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group",
        name: "Test Group",
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      await result.current.createGroup({ name: "Test Group", image: undefined });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-123",
        name: "Test Group",
        image: undefined,
      });
    });

    it("should handle null image", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: "new-group",
        name: "Test Group",
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateGroup("trip-123"));

      await result.current.createGroup({ name: "Test Group", image: null });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        tripId: "trip-123",
        name: "Test Group",
        image: null,
      });
    });
  });
});
