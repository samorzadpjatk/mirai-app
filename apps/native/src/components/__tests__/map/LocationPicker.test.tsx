import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { LocationPicker } from "../../map/LocationPicker";

const mockOnLocationSelected = jest.fn();
const mockOnClose = jest.fn();

jest.mock("@maplibre/maplibre-react-native", () => {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
  const { forwardRef, useImperativeHandle, createElement } = require("react");
  const { View } = require("react-native");

  const Camera = forwardRef((_, ref) => {
    useImperativeHandle(ref, () => ({ setCamera: jest.fn() }));
    return createElement(View, { testID: "camera" });
  });

  const MapView = (props) => createElement(View, { testID: "map-view" }, props.children);
  const MarkerView = (props) => createElement(View, { testID: "marker-view" }, props.children);
  const RasterSource = (props) => createElement(View, { testID: "raster-source" }, props.children);
  const RasterLayer = () => createElement(View, { testID: "raster-layer" });

  return {
    MapView,
    Camera,
    MarkerView,
    RasterSource,
    RasterLayer,
  };
  /* eslint-enable */
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
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
  const { createElement } = require("react");
  const { View } = require("react-native");

  const SafeAreaProvider = (props) => createElement(View, null, props.children);

  return {
    SafeAreaProvider,
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  };
  /* eslint-enable */
});

jest.mock("@expo/vector-icons", () => {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
  const { createElement } = require("react");
  const { View } = require("react-native");

  return {
    Ionicons: (props) =>
      createElement(View, {
        testID: `icon-${props.name}`,
        style: { width: props.size, height: props.size, color: props.color },
      }),
  };
  /* eslint-enable */
});

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
