import React from "react";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { LocationPicker } from "../../map/LocationPicker";

const mockOnLocationSelected = jest.fn();
const mockOnClose = jest.fn();

interface MapViewProps {
  children?: React.ReactNode;
}

interface MarkerViewProps {
  children?: React.ReactNode;
}

interface RasterSourceProps {
  children?: React.ReactNode;
}

jest.mock("@maplibre/maplibre-react-native", () => {
  const { forwardRef, useImperativeHandle, createElement } = require("react");
  const { View } = require("react-native");

  const Camera = forwardRef((_props: unknown, ref: React.Ref<{ setCamera: jest.Mock }>) => {
    useImperativeHandle(ref, () => ({ setCamera: jest.fn() }));
    return createElement(View, { testID: "camera" });
  });

  const MapView = (props: MapViewProps) =>
    createElement(View, { testID: "map-view" }, props.children);
  const MarkerView = (props: MarkerViewProps) =>
    createElement(View, { testID: "marker-view" }, props.children);
  const RasterSource = (props: RasterSourceProps) =>
    createElement(View, { testID: "raster-source" }, props.children);
  const RasterLayer = () => createElement(View, { testID: "raster-layer" });

  return {
    MapView,
    Camera,
    MarkerView,
    RasterSource,
    RasterLayer,
  };
});

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationPosition {
  coords: LocationCoords;
}

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 52.23, longitude: 21.01 } }),
  ),
  PermissionStatus: { GRANTED: "granted", DENIED: "denied" },
  Accuracy: { Balanced: 2 },
}));

interface SafeAreaProviderProps {
  children?: React.ReactNode;
}

jest.mock("react-native-safe-area-context", () => {
  const { createElement } = require("react");
  const { View } = require("react-native");

  const SafeAreaProvider = (props: SafeAreaProviderProps) =>
    createElement(View, null, props.children);

  return {
    SafeAreaProvider,
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  };
});

interface IoniconsProps {
  name: string;
  size?: number;
  color?: string;
}

jest.mock("@expo/vector-icons", () => {
  const { createElement } = require("react");
  const { View } = require("react-native");

  return {
    Ionicons: (props: IoniconsProps) =>
      createElement(View, {
        testID: `icon-${props.name}`,
        style: { width: props.size, height: props.size, color: props.color },
      }),
  };
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
    renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(screen.getByText("Select Location")).toBeOnTheScreen();
    expect(screen.getByText("Cancel")).toBeOnTheScreen();
    expect(screen.getByText("Confirm")).toBeOnTheScreen();
  });

  it("calls onClose when cancel is pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LocationPicker {...defaultProps} />);

    await user.press(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders confirm button in the initial state", () => {
    renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(screen.getByText("Confirm")).toBeOnTheScreen();
  });

  it("renders the map and overlay layers", () => {
    renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(screen.getByTestId("map-view")).toBeOnTheScreen();
    expect(screen.getByTestId("marker-view")).toBeOnTheScreen();
    expect(screen.getByTestId("raster-source")).toBeOnTheScreen();
    expect(screen.getByTestId("raster-layer")).toBeOnTheScreen();
    expect(screen.getByText("Loading map...")).toBeOnTheScreen();
    expect(screen.getByText("Tap on the map to select a location")).toBeOnTheScreen();
  });

  it("renders the location button icon", () => {
    renderWithProviders(<LocationPicker {...defaultProps} />);

    expect(screen.getByTestId("icon-location-sharp")).toBeOnTheScreen();
  });

  it("supports light theme", () => {
    renderWithProviders(<LocationPicker {...defaultProps} mapTheme="light" />);

    expect(screen.getByTestId("map-view")).toBeOnTheScreen();
  });
});
