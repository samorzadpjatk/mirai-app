import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapScreenOverlay } from "../../map/overlays/MapScreenOverlay";

const mockGetMapOverlayStore = jest.fn(() => ({
  selectedUser: null,
  showUsersList: false,
  panelStyle: {},
  panGesture: { active: false },
}));

const mockGetLocationContext = jest.fn(() => ({
  canViewOthersLocations: true,
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: () => mockGetLocationContext(),
}));

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: function MockAnimatedView({ children, style }: { children?: React.ReactNode; style?: object }) {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, { testID: "animated-view", style }, children);
    },
  },
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureDetector: function MockGestureDetector({ children }: { children: React.ReactNode }) {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "gesture-detector" }, children);
  },
}));

jest.mock("~/components/map/MapActionButtons", () => ({
  MapActionButtons: function MockMapActionButtons() {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "map-action-buttons" });
  },
}));

jest.mock("~/components/map/modals/ManageSharingModal", () => ({
  ManageSharingModal: function MockManageSharingModal() {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "manage-sharing-modal" });
  },
}));

jest.mock("~/components/map/modals/ShareLocationModal", () => ({
  ShareLocationModal: function MockShareLocationModal() {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "share-location-modal" });
  },
}));

jest.mock("~/components/map/ui/SelectedUserCard", () => ({
  SelectedUserCard: function MockSelectedUserCard() {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "selected-user-card" });
  },
}));

jest.mock("~/components/map/panels/UsersListPanel", () => ({
  UsersListPanel: function MockUsersListPanel() {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "users-list-panel" });
  },
}));

describe("MapScreenOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMapOverlayStore.mockReturnValue({
      selectedUser: null,
      showUsersList: false,
      panelStyle: {},
      panGesture: { active: false },
    });
    mockGetLocationContext.mockReturnValue({
      canViewOthersLocations: true,
    });
  });

  it("renders the always-visible controls", () => {
    const { getByTestId } = renderWithProviders(<MapScreenOverlay />);

    expect(getByTestId("map-action-buttons")).toBeTruthy();
    expect(getByTestId("share-location-modal")).toBeTruthy();
    expect(getByTestId("manage-sharing-modal")).toBeTruthy();
  });

  it("renders selected user card when a user is selected", () => {
    mockGetMapOverlayStore.mockReturnValue({
      selectedUser: { id: "user-1", name: "John Doe" },
      showUsersList: false,
      panelStyle: {},
      panGesture: { active: false },
    });

    const { getByTestId, queryByTestId } = renderWithProviders(<MapScreenOverlay />);

    expect(getByTestId("selected-user-card")).toBeTruthy();
    expect(queryByTestId("users-list-panel")).toBeNull();
  });

  it("renders users list when requested", () => {
    mockGetMapOverlayStore.mockReturnValue({
      selectedUser: null,
      showUsersList: true,
      panelStyle: {},
      panGesture: { active: false },
    });

    const { getByTestId } = renderWithProviders(<MapScreenOverlay />);

    expect(getByTestId("users-list-panel")).toBeTruthy();
  });

  it("hides the overlay when location viewing is disabled", () => {
    mockGetLocationContext.mockReturnValue({
      canViewOthersLocations: false,
    });

    const { queryByTestId } = renderWithProviders(<MapScreenOverlay />);

    expect(queryByTestId("gesture-detector")).toBeNull();
    expect(queryByTestId("animated-view")).toBeNull();
  });

  it("applies panel styles from the store", () => {
    mockGetMapOverlayStore.mockReturnValue({
      selectedUser: { id: "user-1", name: "John Doe" },
      showUsersList: false,
      panelStyle: { backgroundColor: "red" },
      panGesture: { active: false },
    });

    const { getByTestId } = renderWithProviders(<MapScreenOverlay />);

    const animatedView = getByTestId("animated-view");
    expect(animatedView.props.style[1]).toEqual({ backgroundColor: "red" });
  });
});
