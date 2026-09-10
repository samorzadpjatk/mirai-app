import { act, fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { ReactNode } from "react";
import type { UserLocation } from "~/components/map/UserMap";
import {
  MapOverlayProvider,
  MapOverlayStateProvider,
  buildMapOverlaySyncState,
  mapOverlayStore,
} from "~/stores/map";
import { MapScreenOverlay } from "../../map/overlays/MapScreenOverlay";
import { renderWithProviders } from "../helpers/renderWithProviders";

/**
 * REGRESSION SUITE — deliberately does NOT mock `~/stores/map`.
 *
 * The sibling map component tests mock the overlay store wholesale, which is
 * exactly why these bugs survived review: with the store mocked, every
 * component reads the same fake object, so the real wiring is never exercised.
 * These tests drive the real store + the real overlay hook.
 */

const mockLocationContext = {
  canViewOthersLocations: true,
  canShareOwnLocation: true,
  isLocationSharingEnabled: true,
  isLoading: false,
  isUpdatingSharing: false,
  toggleLocationSharing: jest.fn(),
  isBackgroundLocationEnabled: false,
  isUpdatingBackgroundLocation: false,
  toggleBackgroundLocationUpdates: jest.fn(),
};

jest.mock("~/stores/location", () => ({
  useLocationContext: () => mockLocationContext,
}));

jest.mock("react-native-gesture-handler", () => {
  const panGesture: Record<string, unknown> = {};
  panGesture.onBegin = () => panGesture;
  panGesture.onUpdate = () => panGesture;
  panGesture.onEnd = () => panGesture;

  return {
    Gesture: { Pan: () => panGesture },
    GestureDetector: ({ children }: { children: ReactNode }) => children,
  };
});

const FRIEND: UserLocation = {
  id: "friend-1",
  name: "Ada Lovelace",
  coordinate: [21.0122, 52.2297],
  avatarUrl: null,
  address: "Somewhere",
  lastActiveAt: Date.now(),
};

function seedStore() {
  mapOverlayStore.setState({
    users: [FRIEND],
    currentUserId: "me-1",
    showUsersList: true,
    isListExpanded: false,
    showManageModal: false,
    followMode: null,
    focusedCoordinate: null,
    mapTheme: "dark",
    sharingUserIds: [],
    allAvailableUsers: [{ id: "friend-1", firstName: "Ada", lastName: "Lovelace", image: null }],
    sharingSettings: { usersToShareWith: [] },
    isRemovingUser: false,
  });
}

function renderOverlay() {
  return renderWithProviders(
    <MapOverlayProvider
      value={{
        session: { user: { id: "me-1" } },
        updateSharing: jest.fn(async () => undefined),
        removeUser: jest.fn(async () => undefined),
        currentCoordinate: null,
      }}
    >
      <MapOverlayStateProvider>
        <MapScreenOverlay />
      </MapOverlayStateProvider>
    </MapOverlayProvider>,
  );
}

describe("map overlay shared state (real store)", () => {
  beforeEach(() => {
    seedStore();
  });

  it("opens the share modal from the users-list plus button", () => {
    renderOverlay();

    expect(screen.queryByTestId("app-modal")).toBeNull();

    fireEvent.press(screen.getByTestId("map-add-share-button"), { stopPropagation: jest.fn() });

    expect(screen.getByTestId("app-modal")).toBeTruthy();
    expect(screen.getByText("Share Location With")).toBeTruthy();
  });

  it("opens the manage modal from the gear button", () => {
    renderOverlay();

    fireEvent.press(screen.getByTestId("map-manage-sharing-button"), {
      stopPropagation: jest.fn(),
    });

    expect(screen.getByText("Manage Location Sharing")).toBeTruthy();
  });

  it("shows the selected user card when a user is picked from the list", () => {
    renderOverlay();

    fireEvent.press(screen.getByText("Ada Lovelace"));

    // The selected user lives in the shared controller, so the card that
    // replaces the list can actually see it.
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Lovelace")).toBeTruthy();
    expect(mapOverlayStore.getState().showUsersList).toBe(false);
  });

  it("keeps the toggled map theme when screen data is synced into the store", () => {
    renderOverlay();

    expect(mapOverlayStore.getState().mapTheme).toBe("dark");

    fireEvent.press(screen.getByTestId("theme-toggle-button"));
    expect(mapOverlayStore.getState().mapTheme).toBe("light");

    // Simulate the map screen's data-sync effect firing again (it re-runs about
    // once a second because useMapUsers rebuilds the users array on a timer).
    act(() => {
      mapOverlayStore.setState(
        buildMapOverlaySyncState({
          users: [{ ...FRIEND, lastActiveAt: Date.now() }],
          currentUserId: "me-1",
          sharingUserIds: [],
          allAvailableUsers: [],
          sharingSettings: { usersToShareWith: [] },
          isRemovingUser: false,
        }),
      );
    });

    expect(mapOverlayStore.getState().mapTheme).toBe("light");
  });
});

describe("buildMapOverlaySyncState", () => {
  it("never carries a map theme", () => {
    const synced = buildMapOverlaySyncState({
      users: [],
      currentUserId: "me-1",
      sharingUserIds: [],
      allAvailableUsers: undefined,
      sharingSettings: undefined,
      isRemovingUser: false,
    });

    expect(Object.keys(synced)).not.toContain("mapTheme");
  });
});
