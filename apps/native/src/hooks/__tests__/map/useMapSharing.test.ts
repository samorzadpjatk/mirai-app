import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useMapSharing } from "../../map/useMapSharing";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockAlertAlert = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: function(...args: unknown[]): unknown {
    return mockUseQuery.apply(this, args);
  },
  useMutation: function(...args: unknown[]): unknown {
    return mockUseMutation.apply(this, args);
  },
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    location: {
      getMySharingSettings: {
        queryOptions: jest.fn(() => ({ queryKey: ["sharing-settings"] })),
      },
      getAllUsersForSharing: {
        queryOptions: jest.fn((input: unknown) => ({ queryKey: ["users-for-sharing", input] })),
      },
      updateSharingSettings: {
        mutationOptions: jest.fn((options: unknown) => ({ options })),
      },
      removeUserFromSharing: {
        mutationOptions: jest.fn((options: unknown) => ({ options })),
      },
    },
  })),
}));

jest.mock("react-native", () => ({
  Alert: {
    alert: function(...args: unknown[]): void {
      mockAlertAlert.apply(this, args);
    },
  },
}));

describe("useMapSharing", () => {
  const mockRefetchSharing = jest.fn();
  const mockMutateAsync = jest.fn();
  const mockRemoveUserMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: null,
      refetch: mockRefetchSharing,
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it("should return null sharingSettings when data is not loaded", () => {
    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.sharingSettings).toBeNull();
  });

  it("should return sharingSettings when data is loaded", () => {
    const sharingData = {
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1", name: "John" }],
    };
    mockUseQuery.mockReturnValue({
      data: sharingData,
      refetch: mockRefetchSharing,
      isLoading: false,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.sharingSettings).toEqual(sharingData);
  });

  it("should compute sharingUserIds from sharingSettings", () => {
    const sharingData = {
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1" }, { id: "user-2" }],
    };
    mockUseQuery.mockReturnValue({
      data: sharingData,
      refetch: mockRefetchSharing,
      isLoading: false,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.sharingUserIds).toEqual(["user-1", "user-2"]);
  });

  it("should return empty array for sharingUserIds when no settings", () => {
    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.sharingUserIds).toEqual([]);
  });

  it("should fetch allAvailableUsers when enabled and tripId provided", () => {
    const usersData = [{ id: "user-1", name: "John" }, { id: "user-2", name: "Jane" }];
    mockUseQuery
      .mockReturnValueOnce({
        data: null,
        refetch: mockRefetchSharing,
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: usersData,
        isLoading: false,
      });

    const { result } = renderHook(() => useMapSharing(true, "trip-1"));

    expect(result.current.allAvailableUsers).toEqual(usersData);
  });

  it("should not fetch allAvailableUsers when enabledForAllUsersQuery is false", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      refetch: mockRefetchSharing,
      isLoading: false,
    });

    const { result } = renderHook(() => useMapSharing(false, "trip-1"));

    expect(result.current.allAvailableUsers).toBeNull();
  });

  it("should not fetch allAvailableUsers when tripId is null", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      refetch: mockRefetchSharing,
      isLoading: false,
    });

    const { result } = renderHook(() => useMapSharing(true, null));

    expect(result.current.allAvailableUsers).toBeNull();
  });

  it("should call updateSharing with correct parameters", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const { result } = renderHook(() => useMapSharing(false, "trip-1"));

    await act(async () => {
      await result.current.updateSharing(["user-1", "user-2"]);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      isSharingLocation: true,
      userIdsToShareWith: ["user-1", "user-2"],
      tripId: "trip-1",
    });
  });

  it("should handle undefined tripId in updateSharing", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    await act(async () => {
      await result.current.updateSharing(["user-1"]);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      isSharingLocation: true,
      userIdsToShareWith: ["user-1"],
      tripId: undefined,
    });
  });

  it("should refetch sharing settings after successful update", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    await act(async () => {
      await result.current.updateSharing(["user-1"]);
    });

    expect(mockRefetchSharing).toHaveBeenCalled();
  });

  it("should show alert when updateSharing fails", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    const error = new Error("Update failed");
    mockMutateAsync.mockRejectedValue(error);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderHook(() => useMapSharing(false, null));

    // Get the onError callback from the mutation options passed to useMutation
    const mutationOptions = mockUseMutation.mock.calls[0]?.[0] as { options?: { onError?: (error: Error) => void } } | undefined;
    const onErrorCallback = mutationOptions?.options?.onError;
    if (onErrorCallback) {
      onErrorCallback(error);
    }

    // Filter out react-test-renderer warnings and find expected call
    const expectedCall = consoleErrorSpy.mock.calls.find(
      (call) => call[0] === "[Map] Failed to update sharing:"
    );
    expect(expectedCall).toBeDefined();
    expect(expectedCall).toEqual(["[Map] Failed to update sharing:", error]);
    expect(mockAlertAlert).toHaveBeenCalledWith(
      "Update Failed",
      "Failed to update sharing settings. Please try again."
    );

    consoleErrorSpy.mockRestore();
  });

  it("should call removeUser with correct userId", async () => {
    mockRemoveUserMutateAsync.mockResolvedValue(undefined);
    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockMutateAsync,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockRemoveUserMutateAsync,
        isPending: false,
      });

    const { result } = renderHook(() => useMapSharing(false, null));

    await act(async () => {
      await result.current.removeUser("user-1");
    });

    expect(mockRemoveUserMutateAsync).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("should refetch sharing settings after successful removeUser", async () => {
    mockRemoveUserMutateAsync.mockResolvedValue(undefined);
    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockMutateAsync,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockRemoveUserMutateAsync,
        isPending: false,
      });

    const { result } = renderHook(() => useMapSharing(false, null));

    await act(async () => {
      await result.current.removeUser("user-1");
    });

    expect(mockRefetchSharing).toHaveBeenCalled();
  });

  it("should show alert when removeUser fails", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });
    const error = new Error("Remove failed");
    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockMutateAsync,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockRemoveUserMutateAsync,
        isPending: false,
      });

    renderHook(() => useMapSharing(false, null));

    // Get the onError callback from the second mutation options (removeUser)
    const mutationOptions = mockUseMutation.mock.calls[1]?.[0] as { options?: { onError?: (error: Error) => void } } | undefined;
    const onErrorCallback = mutationOptions?.options?.onError;
    if (onErrorCallback) {
      onErrorCallback(error);
    }

    // Filter out react-test-renderer warnings and find expected call
    const expectedCall = consoleErrorSpy.mock.calls.find(
      (call) => call[0] === "[Map] Failed to remove user from sharing:"
    );
    expect(expectedCall).toBeDefined();
    expect(expectedCall).toEqual(["[Map] Failed to remove user from sharing:", error]);
    expect(mockAlertAlert).toHaveBeenCalledWith(
      "Remove Failed",
      "Failed to remove user from sharing. Please try again."
    );

    consoleErrorSpy.mockRestore();
  });

  it("should expose refetchSharing function", () => {
    const { result } = renderHook(() => useMapSharing(false, null));

    expect(typeof result.current.refetchSharing).toBe("function");
  });

  it("should return isUpdatingSharing as true when mutation is pending", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.isUpdatingSharing).toBe(true);
  });

  it("should return isRemovingUser as true when remove mutation is pending", () => {
    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockMutateAsync,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockRemoveUserMutateAsync,
        isPending: true,
      });

    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.isRemovingUser).toBe(true);
  });

  it("should handle empty usersToShareWith array", () => {
    const sharingData = {
      isSharingLocation: false,
      usersToShareWith: [],
    };
    mockUseQuery.mockReturnValue({
      data: sharingData,
      refetch: mockRefetchSharing,
      isLoading: false,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.sharingUserIds).toEqual([]);
  });

  it("should memoize sharingUserIds", () => {
    const sharingData = {
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1" }],
    };
    mockUseQuery.mockReturnValue({
      data: sharingData,
      refetch: mockRefetchSharing,
      isLoading: false,
    });

    const { result, rerender } = renderHook(() => useMapSharing(false, null));
    const firstSharingUserIds = result.current.sharingUserIds;

    rerender();

    expect(result.current.sharingUserIds).toBe(firstSharingUserIds);
  });
});