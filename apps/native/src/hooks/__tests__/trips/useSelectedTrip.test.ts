import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useSelectedTrip } from "../../trips/useSelectedTrip";

const mockGetSelectedTripIdFromStorage: jest.MockedFunction<() => Promise<string | null>> = jest.fn();
const mockSetSelectedTripIdInStorage: jest.MockedFunction<(id: string | null) => Promise<void>> = jest.fn();
const mockClearSelectedTripIdInStorage: jest.MockedFunction<() => Promise<void>> = jest.fn();

jest.mock("~/services/storage/selectedTripStorage", () => ({
  getSelectedTripIdFromStorage: (): Promise<string | null> => mockGetSelectedTripIdFromStorage(),
  setSelectedTripIdInStorage: (id: string | null): Promise<void> => mockSetSelectedTripIdInStorage(id),
  clearSelectedTripIdInStorage: (): Promise<void> => mockClearSelectedTripIdInStorage(),
}));

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockSetQueryData = jest.fn();
const mockQueryClient = {
  setQueryData: mockSetQueryData,
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: jest.fn(() => mockQueryClient),
}));

describe("useSelectedTrip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSelectedTripIdFromStorage.mockResolvedValue(null);
  });

  it("should return null when no trip is selected", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    expect(result.current.selectedTripId).toBeNull();
    expect(result.current.isLoadingSelectedTrip).toBe(false);
  });

  it("should return selected trip id from storage", async () => {
    mockGetSelectedTripIdFromStorage.mockResolvedValue("trip-123");

    mockUseQuery.mockReturnValue({
      data: "trip-123",
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-123");
    });
  });

  it("should indicate loading while fetching from storage", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    expect(result.current.isLoadingSelectedTrip).toBe(true);
  });

  it("should set selected trip id", async () => {
    const mutateMock = jest.fn((tripId: string | null, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    });

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId("trip-456");
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith("trip-456", expect.any(Object));
    });
  });

  it("should clear selected trip id when null is passed", async () => {
    const mutateMock = jest.fn((tripId: string | null, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    });

    mockUseQuery.mockReturnValue({
      data: "trip-123",
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId(null);
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(null, expect.any(Object));
    });
  });

  it("should call mutation with correct parameters", async () => {
    const mutateMock = jest.fn();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId("trip-789");
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        "trip-789",
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  it("should handle mutation error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const error = new Error("Storage error");

    const mutateMock = jest.fn((tripId: string | null, options?: { onError?: (error: unknown) => void }) => {
      if (options?.onError) {
        options.onError(error);
      }
    });

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId("trip-123");
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to persist selected trip in storage:",
        error
      );
    });

    consoleSpy.mockRestore();
  });

  it("should store trip id in secure storage when setting", async () => {
    mockSetSelectedTripIdInStorage.mockResolvedValue(undefined);

    mockUseMutation.mockImplementation(() => ({
      mutate: (tripId: string | null, options?: { onSuccess?: (data: string | null) => void }) => {
        void mockSetSelectedTripIdInStorage(tripId).then(() => {
          if (options?.onSuccess) {
            options.onSuccess(tripId);
          }
        });
      },
      isLoading: false,
      error: null,
    }));

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId("trip-secure");
    });

    await waitFor(() => {
      expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledWith("trip-secure");
    });
  });

  it("should clear storage when setting null", async () => {
    mockClearSelectedTripIdInStorage.mockResolvedValue(undefined);

    mockUseMutation.mockImplementation(() => ({
      mutate: (tripId: string | null, options?: { onSuccess?: (data: string | null) => void }) => {
        if (tripId === null) {
          void mockClearSelectedTripIdInStorage().then(() => {
            if (options?.onSuccess) {
              options.onSuccess(null);
            }
          });
        }
      },
      isLoading: false,
      error: null,
    }));

    mockUseQuery.mockReturnValue({
      data: "trip-123",
      isLoading: false,
    });

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId(null);
    });

    await waitFor(() => {
      expect(mockClearSelectedTripIdInStorage).toHaveBeenCalled();
    });
  });

  it("should use infinite stale time for selected trip query", () => {
    let capturedQueryConfig: { staleTime?: number } = {};

    mockUseQuery.mockImplementation((config: { staleTime?: number }) => {
      capturedQueryConfig = config;
      return {
        data: null,
        isLoading: false,
      };
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    renderHook(() => useSelectedTrip());

    expect(capturedQueryConfig.staleTime).toBe(Infinity);
  });

  it("should use correct query key for selected trip", () => {
    let capturedQueryConfig: { queryKey?: readonly string[] } = {};

    mockUseQuery.mockImplementation((config: { queryKey?: readonly string[] }) => {
      capturedQueryConfig = config;
      return {
        data: null,
        isLoading: false,
      };
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    renderHook(() => useSelectedTrip());

    expect(capturedQueryConfig.queryKey).toEqual(["selected-trip-id"]);
  });

  it("should execute mutationFn to set trip ID", async () => {
    mockSetSelectedTripIdInStorage.mockResolvedValue(undefined);

    let capturedMutationFn: ((tripId: string | null) => Promise<string | null>) | undefined;

    mockUseMutation.mockImplementation((config: { mutationFn?: (tripId: string | null) => Promise<string | null> }) => {
      capturedMutationFn = config.mutationFn;
      return {
        mutate: jest.fn((tripId: string | null, options?: { onSuccess?: (data: string | null) => void }) => {
          if (capturedMutationFn) {
            void capturedMutationFn(tripId).then((result) => {
              if (options?.onSuccess) {
                options.onSuccess(result);
              }
            });
          }
        }),
        isLoading: false,
        error: null,
      };
    });

    renderHook(() => useSelectedTrip());

    expect(capturedMutationFn).toBeDefined();

    if (capturedMutationFn) {
      const result = await capturedMutationFn("trip-123");
      expect(result).toBe("trip-123");
      expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledWith("trip-123");
    }
  });

  it("should execute mutationFn to clear trip ID when null is passed", async () => {
    mockClearSelectedTripIdInStorage.mockResolvedValue(undefined);

    let capturedMutationFn: ((tripId: string | null) => Promise<string | null>) | undefined;

    mockUseMutation.mockImplementation((config: { mutationFn?: (tripId: string | null) => Promise<string | null> }) => {
      capturedMutationFn = config.mutationFn;
      return {
        mutate: jest.fn((tripId: string | null, options?: { onSuccess?: (data: string | null) => void }) => {
          if (capturedMutationFn) {
            void capturedMutationFn(tripId).then((result) => {
              if (options?.onSuccess) {
                options.onSuccess(result);
              }
            });
          }
        }),
        isLoading: false,
        error: null,
      };
    });

    renderHook(() => useSelectedTrip());

    expect(capturedMutationFn).toBeDefined();

    if (capturedMutationFn) {
      const result = await capturedMutationFn(null);
      expect(result).toBeNull();
      expect(mockClearSelectedTripIdInStorage).toHaveBeenCalled();
    }
  });

  it("should handle onSuccess callback in mutation", () => {
    mockSetSelectedTripIdInStorage.mockResolvedValue(undefined);

    let capturedOnSuccess: ((data: string | null) => void) | undefined;

    mockUseMutation.mockImplementation((config: { onSuccess?: (data: string | null) => void }) => {
      capturedOnSuccess = config.onSuccess;
      return {
        mutate: jest.fn((tripId: string | null, options?: { onSuccess?: (data: string | null) => void }) => {
          void mockSetSelectedTripIdInStorage(tripId).then(() => {
            const onSuccessCallback = options?.onSuccess ?? capturedOnSuccess;
            if (onSuccessCallback) {
              onSuccessCallback(tripId);
            }
          });
        }),
        isLoading: false,
        error: null,
      };
    });

    renderHook(() => useSelectedTrip());

    expect(capturedOnSuccess).toBeDefined();

    if (capturedOnSuccess) {
      capturedOnSuccess("trip-456");
      expect(mockSetQueryData).toHaveBeenCalledWith(["selected-trip-id"], "trip-456");
    }
  });

  it("should handle mutation error in setSelectedTripId", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const storageError = new Error("Storage write failed");
    mockSetSelectedTripIdInStorage.mockRejectedValue(storageError);

    let capturedOnError: ((error: unknown) => void) | undefined;

    mockUseMutation.mockImplementation(() => ({
      mutate: jest.fn((tripId: string | null, options?: { onError?: (error: unknown) => void }) => {
        capturedOnError = options?.onError;
        void mockSetSelectedTripIdInStorage(tripId).catch((err: Error) => {
          if (options?.onError) {
            options.onError(err);
          }
        });
      }),
      isLoading: false,
      error: null,
    }));

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId("trip-error");
    });

    await waitFor(() => {
      expect(capturedOnError).toBeDefined();
    });

    if (capturedOnError) {
      capturedOnError(storageError);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to persist selected trip in storage:", storageError);
    }

    consoleSpy.mockRestore();
  });

  it("should handle setSelectedTripId with callback execution", async () => {
    const mutateMock = jest.fn((tripId: string | null, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
      void mockSetSelectedTripIdInStorage(tripId).then(() => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      }).catch((err: Error) => {
        if (options?.onError) {
          options.onError(err);
        }
      });
    });

    mockUseMutation.mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSelectedTrip());

    act(() => {
      result.current.setSelectedTripId("trip-callback");
    });

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith("trip-callback", expect.any(Object));
    });
  });
});
