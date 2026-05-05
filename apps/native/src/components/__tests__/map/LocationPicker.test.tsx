import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { LocationPicker } from "../../map/LocationPicker";

const mockOnLocationSelected = jest.fn();
const mockOnClose = jest.fn();

jest.mock("@maplibre/maplibre-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Camera = React.forwardRef((_props, ref) => {
    React.useImperativeHandle(ref, () => ({ setCamera: jest.fn() }));
    return React.createElement(View, { testID: "camera" });
  });

  return {
    MapView: ({ children }: { children?: React.ReactNode }) => React.createElement(View, { testID: "map-view" }, children),
    Camera,
    MarkerView: ({ children }: { children?: React.ReactNode }) => React.createElement(View, { testID: "marker-view" }, children),
    RasterSource: ({ children }: { children?: React.ReactNode }) => React.createElement(View, { testID: "raster-source" }, children),
    RasterLayer: () => React.createElement(View, { testID: "raster-layer" }),
  };
});

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 52.23, longitude: 21.01 } })
  ),
  PermissionStatus: { GRANTED: "granted", DENIED: "denied" },
  Accuracy: { Balanced: 2 },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: `icon-${name}`, style: { width: size, height: size, color } });
  },
}));

describe("LocationPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    visible: true,
    initialLocation: null,
    onLocationSelected: mockOnLocationSelected,
    onClose: mockOnClose,
    mapTheme: "dark" as const,
  };

  it("renders the dialog chrome", () => {
    const { getByText } = renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(getByText("Select Location")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Confirm")).toBeTruthy();
  });

  it("calls onClose when cancel is pressed", () => {
    const { getByText } = renderWithProviders(<LocationPicker {...defaultProps} />);

    fireEvent.press(getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders confirm button in the initial state", () => {
    const { getByText } = renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(getByText("Confirm")).toBeTruthy();
  });

  it("renders the map and overlay layers", () => {
    const { getByTestId, getByText } = renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(getByTestId("map-view")).toBeTruthy();
    expect(getByTestId("marker-view")).toBeTruthy();
    expect(getByTestId("raster-source")).toBeTruthy();
    expect(getByTestId("raster-layer")).toBeTruthy();
    expect(getByText("Loading map...")).toBeTruthy();
    expect(getByText("Tap on the map to select a location")).toBeTruthy();
  });

  it("renders the location button icon", () => {
    const { getByTestId } = renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(getByTestId("icon-location-sharp")).toBeTruthy();
  });

  it("supports light theme", () => {
    const { getByTestId } = renderWithProviders(<LocationPicker {...defaultProps} mapTheme="light" />);

    expect(getByTestId("map-view")).toBeTruthy();
  });
});
