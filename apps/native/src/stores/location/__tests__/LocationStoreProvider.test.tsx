import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import React from "react";
import { Alert, Text } from "react-native";
import { render, waitFor } from "@testing-library/react-native";
import { LocationStoreProvider } from "../LocationStoreProvider";
import { locationStore, setLocationServerUpdater } from "../locationStore";

const mockTRPC = {
  location: {
    getMySharingSettings: {
      queryOptions: jest.fn(() => ({
        queryKey: ["location", "getMySharingSettings"],
      })),
    },
    updateSharingSettings: {
      mutationOptions: jest.fn((options: { onSuccess?: (data: unknown, variables: unknown, context: unknown) => void }) => ({
        mutationKey: ["location", "updateSharingSettings"],
        ...options,
      })),
    },
  },
};

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: () => mockTRPC,
}));

const mockUseQuery = jest.fn<ReturnType<typeof import("@tanstack/react-query").useQuery>, Parameters<typeof import("@tanstack/react-query").useQuery>>();
const mockUseMutation = jest.fn<ReturnType<typeof import("@tanstack/react-query").useMutation>, Parameters<typeof import("@tanstack/react-query").useMutation>>();
const mockInvalidateQueries = jest.fn<Promise<void>, [unknown]>();
const mockQueryClient = {
  invalidateQueries: (...args: [unknown]) => mockInvalidateQueries(...args),
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockQueryClient,
}));

describe("LocationStoreProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
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

    mockUseMutation.mockImplementation((options: { onSuccess?: (data: unknown, variables: unknown, context: unknown) => void | Promise<void>; onError?: (error: unknown) => void }) => ({
      mutateAsync: jest.fn(async (input: unknown) => {
        if (options?.onSuccess) {
          await options.onSuccess(undefined, input, undefined);
        }
        return undefined;
      }),
      mutate: jest.fn((input: unknown) => {
        if (options?.onSuccess) {
          void options.onSuccess(undefined, input, undefined);
        }
      }),
      isPending: false,
    }));
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
    expect(() => render(<LocationStoreProvider />)).not.toThrow();
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
