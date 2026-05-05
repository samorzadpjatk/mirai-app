import React from "react";
import { TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapActionButtons } from "../../map/MapActionButtons";

const mockToggleLocationSharing = jest.fn();
const mockToggleBackgroundLocation = jest.fn();
const mockToggleTheme = jest.fn();
const mockOnRecenter = jest.fn();

const mockGetLocationState = jest.fn(() => ({
  isLocationSharingEnabled: true,
  isLoading: false,
  isUpdatingSharing: false,
  toggleLocationSharing: mockToggleLocationSharing,
  isBackgroundLocationEnabled: true,
  isUpdatingBackgroundLocation: false,
  toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
}));

const mockGetMapState = jest.fn(() => ({
  mapTheme: "dark",
  onRecenter: mockOnRecenter,
  toggleTheme: mockToggleTheme,
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: () => mockGetLocationState(),
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapState(),
}));

describe("MapActionButtons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocationState.mockReturnValue({
      isLocationSharingEnabled: true,
      isLoading: false,
      isUpdatingSharing: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: true,
      isUpdatingBackgroundLocation: false,
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
    });
    mockGetMapState.mockReturnValue({
      mapTheme: "dark",
      onRecenter: mockOnRecenter,
      toggleTheme: mockToggleTheme,
    });
  });

  it("should render location toggle button", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    expect(UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should render theme toggle button", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    expect(UNSAFE_getAllByType(Pressable).length).toBeGreaterThanOrEqual(1);
  });

  it("should render recenter button when location sharing is enabled", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    expect(UNSAFE_getAllByType(Pressable).length).toBeGreaterThanOrEqual(2);
  });

  it("should render background toggle with correct status", () => {
    const { getByText, UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    expect(getByText("Background")).toBeTruthy();
    expect(UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should call toggleLocationSharing when location toggle is pressed", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[1]);

    expect(mockToggleLocationSharing).toHaveBeenCalled();
  });

  it("should call toggleBackgroundLocationUpdates when background toggle is pressed", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);

    expect(mockToggleBackgroundLocation).toHaveBeenCalled();
  });

  it("should call toggleTheme when theme button is pressed", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const pressables = UNSAFE_getAllByType(Pressable);
    fireEvent.press(pressables[0]);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it("should call onRecenter when recenter button is pressed", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const pressables = UNSAFE_getAllByType(Pressable);
    fireEvent.press(pressables[1]);

    expect(mockOnRecenter).toHaveBeenCalled();
  });

  it("should show loading indicator when updating sharing", () => {
    mockGetLocationState.mockReturnValue({
      isLocationSharingEnabled: true,
      isLoading: false,
      isUpdatingSharing: true,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: true,
      isUpdatingBackgroundLocation: false,
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(activityIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it("should show loading indicator when updating background location", () => {
    mockGetLocationState.mockReturnValue({
      isLocationSharingEnabled: true,
      isLoading: false,
      isUpdatingSharing: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: true,
      isUpdatingBackgroundLocation: true,
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(activityIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it("should disable background toggle when location sharing is disabled", () => {
    mockGetLocationState.mockReturnValue({
      isLocationSharingEnabled: false,
      isLoading: false,
      isUpdatingSharing: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: false,
      isUpdatingBackgroundLocation: false,
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
    });

    const { getByText, UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    expect(getByText("Background")).toBeTruthy();

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const backgroundButton = buttons[0];
    expect(backgroundButton.props.disabled).toBe(true);
  });

  it("should show background toggle when background location is disabled", () => {
    mockGetLocationState.mockReturnValue({
      isLocationSharingEnabled: true,
      isLoading: false,
      isUpdatingSharing: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: false,
      isUpdatingBackgroundLocation: false,
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
    });

    const { getByText } = renderWithProviders(<MapActionButtons />);

    expect(getByText("Background")).toBeTruthy();
    expect(getByText("Off")).toBeTruthy();
  });

  it("should disable location toggle when loading", () => {
    mockGetLocationState.mockReturnValue({
      isLocationSharingEnabled: true,
      isLoading: true,
      isUpdatingSharing: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: true,
      isUpdatingBackgroundLocation: false,
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocation,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<MapActionButtons />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const locationButton = buttons[1];
    expect(locationButton.props.disabled).toBe(true);
  });
});
