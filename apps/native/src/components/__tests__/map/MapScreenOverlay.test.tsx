import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
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

interface MockAnimatedViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface MockGestureDetectorProps {
  children?: React.ReactNode;
  gesture: unknown;
}

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: () => mockGetLocationContext(),
}));

jest.mock("react-native-reanimated", () => {
  const { View, StyleSheet } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: ({ children, style }: MockAnimatedViewProps) => {
        const flattenedStyle = StyleSheet.flatten(style);
        return (
          <View testID="animated-view" style={flattenedStyle}>
            {children}
          </View>
        );
      },
    },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  return {
    GestureDetector: ({ children, gesture }: MockGestureDetectorProps) => (
      <View testID="gesture-detector" accessibilityLabel={String(gesture)}>
        {children}
      </View>
    ),
  };
});

jest.mock("~/components/map/MapActionButtons", () => {
  const { View } = require("react-native");
  return {
    MapActionButtons: () => <View testID="map-action-buttons" />,
  };
});

jest.mock("~/components/map/modals/ManageSharingModal", () => {
  const { View } = require("react-native");
  return {
    ManageSharingModal: () => <View testID="manage-sharing-modal" />,
  };
});

jest.mock("~/components/map/modals/ShareLocationModal", () => {
  const { View } = require("react-native");
  return {
    ShareLocationModal: () => <View testID="share-location-modal" />,
  };
});

jest.mock("~/components/map/ui/SelectedUserCard", () => {
  const { View } = require("react-native");
  return {
    SelectedUserCard: () => <View testID="selected-user-card" />,
  };
});

jest.mock("~/components/map/panels/UsersListPanel", () => {
  const { View } = require("react-native");
  return {
    UsersListPanel: () => <View testID="users-list-panel" />,
  };
});

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
    // Style is an array: [styles.detailCard, panelStyle]
    expect(animatedView.props.style[1]).toMatchObject({
      backgroundColor: "red",
    });
  });
});
