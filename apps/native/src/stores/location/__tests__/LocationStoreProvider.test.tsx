import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Alert, Text } from "react-native";
import { render, waitFor } from "@testing-library/react-native";
import { LocationStoreProvider } from "../LocationStoreProvider";
import { locationStore, setLocationServerUpdater } from "../locationStore";

const mockGetMySharingSettingsQueryOptions = jest.fn(
  (options: { input: Record<string, unknown>; enabled?: boolean }) => ({
    queryKey: ["location", "getMySharingSettings"],
    enabled: options.enabled,
  }),
);
const mockUpdateSharingSettingsMutationOptions = jest.fn(
  (options: { onSuccess?: () => void | Promise<void>; onError?: (error: unknown) => void }) => ({
    mutationKey: ["location", "updateSharingSettings"],
    onSuccess: options.onSuccess,
    onError: options.onError,
  }),
);

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    location: {
      getMySharingSettings: {
        queryOptions: (options: { input: Record<string, unknown>; enabled?: boolean }) =>
          mockGetMySharingSettingsQueryOptions(options),
      },
      updateSharingSettings: {
        mutationOptions: (options: {
          onSuccess?: () => void | Promise<void>;
          onError?: (error: unknown) => void;
        }) => mockUpdateSharingSettingsMutationOptions(options),
      },
    },
  },
}));

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockQueryClient,
}));

describe("LocationStoreProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    setLocationServerUpdater(null);
    locationStore.setState({
      isLocationSharingEnabled: false,
      permissionStatus: "undetermined",
      backgroundPermissionStatus: "undetermined",
      isBackgroundLocationEnabled: false,
      isBackgroundLocationActive: false,
      isLoading: true,
      isUpdatingSharing: false,
      isUpdatingBackgroundLocation: false,
    });

    mockUseQuery.mockReturnValue({
      data: { isSharingLocation: false },
      isLoading: false,
      error: null,
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const typedOptions = options as {
        onSuccess?: (data: unknown, variables: unknown, context: unknown) => void | Promise<void>;
        onError?: (error: unknown) => void;
      };
      const mutateAsync = jest.fn(async (input: unknown) => {
        if (typedOptions?.onSuccess) {
          await typedOptions.onSuccess(undefined, input, undefined);
        }
        return undefined;
      });
      const mutate = jest.fn((input: unknown) => {
        if (typedOptions?.onSuccess) {
          void typedOptions.onSuccess(undefined, input, undefined);
        }
      });
      return {
        mutateAsync,
        mutate,
        isPending: false,
        isIdle: true,
        isSuccess: false,
        isError: false,
        status: "idle",
        data: undefined,
        error: null,
        reset: jest.fn(),
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        variables: undefined,
        submittedAt: 0,
      };
    });
  });

  it("renders children", () => {
    const { getByText } = render(
      <LocationStoreProvider>
        <Text>Test Child</Text>
      </LocationStoreProvider>,
    );

    expect(getByText("Test Child")).toBeTruthy();
  });

  it("renders without children", () => {
    expect(() => render(<LocationStoreProvider>{null}</LocationStoreProvider>)).not.toThrow();
  });

  it("hydrates the store from server settings", async () => {
    mockUseQuery.mockReturnValue({
      data: { isSharingLocation: true },
      isLoading: false,
      error: null,
    });

    render(
      <LocationStoreProvider>
        <Text>Hydration</Text>
      </LocationStoreProvider>,
    );

    await waitFor(() => {
      expect(locationStore.getState().isLoading).toBe(false);
    });
    expect(locationStore.getState().isLocationSharingEnabled).toBe(true);
  });

  it("falls back to local disabled state when server data is missing", async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(
      <LocationStoreProvider>
        <Text>Fallback</Text>
      </LocationStoreProvider>,
    );

    await waitFor(() => {
      expect(locationStore.getState().isLoading).toBe(false);
    });
    expect(locationStore.getState().isLocationSharingEnabled).toBe(false);
  });

  it("injects the server updater and invalidates queries on success", async () => {
    locationStore.setState({ permissionStatus: "granted" });

    render(
      <LocationStoreProvider>
        <Text>Updater</Text>
      </LocationStoreProvider>,
    );

    await waitFor(() => {
      expect(locationStore.getState().isLoading).toBe(false);
    });

    await locationStore.getState().toggleLocationSharing();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["location", "getMySharingSettings"],
    });
  });
});
