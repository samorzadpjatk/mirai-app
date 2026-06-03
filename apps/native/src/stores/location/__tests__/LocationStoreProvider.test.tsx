import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { Alert, Text } from "react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { LocationStoreProvider } from "../LocationStoreProvider";
import { locationStore, setLocationServerUpdater } from "../locationStore";

describe("LocationStoreProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
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
    server.use(
      createORPCHandler(["location", "getMySharingSettings"], () => ({ isSharingLocation: false })),
    );
  });

  it("renders children", async () => {
    const { getByText } = renderWithMSW(
      <LocationStoreProvider>
        <Text>Test Child</Text>
      </LocationStoreProvider>,
    );
    await waitFor(() => expect(getByText("Test Child")).toBeTruthy());
  });

  it("renders without children", () => {
    expect(() =>
      renderWithMSW(<LocationStoreProvider>{null}</LocationStoreProvider>),
    ).not.toThrow();
  });

  it("hydrates the store from server settings", async () => {
    server.use(
      createORPCHandler(["location", "getMySharingSettings"], () => ({ isSharingLocation: true })),
    );
    renderWithMSW(
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
    server.use(createORPCHandler(["location", "getMySharingSettings"], () => null));
    renderWithMSW(
      <LocationStoreProvider>
        <Text>Fallback</Text>
      </LocationStoreProvider>,
    );
    await waitFor(() => {
      expect(locationStore.getState().isLoading).toBe(false);
    });
    expect(locationStore.getState().isLocationSharingEnabled).toBe(false);
  });

  it("injects the server updater and calls mutation on toggle", async () => {
    locationStore.setState({ permissionStatus: "granted" });
    const updateHandler = jest.fn(() => ({ success: true }));
    server.use(
      createORPCHandler(["location", "getMySharingSettings"], () => ({ isSharingLocation: false })),
      createORPCHandler(["location", "updateSharingSettings"], updateHandler),
    );
    renderWithMSW(
      <LocationStoreProvider>
        <Text>Updater</Text>
      </LocationStoreProvider>,
    );
    await waitFor(() => {
      expect(locationStore.getState().isLoading).toBe(false);
    });
    await locationStore.getState().toggleLocationSharing();
    await waitFor(() => expect(updateHandler).toHaveBeenCalled());
  });
});
