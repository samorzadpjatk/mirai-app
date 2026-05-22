import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
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
    renderWithProviders(<MapActionButtons />);

    expect(screen.getByTestId("location-toggle-button")).toBeOnTheScreen();
  });

  it("should render theme toggle button", () => {
    renderWithProviders(<MapActionButtons />);

    expect(screen.getByText("sunny")).toBeOnTheScreen();
  });

  it("should render recenter button when location sharing is enabled", () => {
    renderWithProviders(<MapActionButtons />);

    expect(screen.getByText("locate")).toBeOnTheScreen();
  });

  it("should render background toggle with correct status", () => {
    renderWithProviders(<MapActionButtons />);

    expect(screen.getByText("Background")).toBeOnTheScreen();
    expect(screen.getByTestId("background-toggle-button")).toBeOnTheScreen();
  });

  it("should call toggleLocationSharing when location toggle is pressed", () => {
    renderWithProviders(<MapActionButtons />);

    fireEvent.press(screen.getByTestId("location-toggle-button"));

    expect(mockToggleLocationSharing).toHaveBeenCalled();
  });

  it("should call toggleBackgroundLocationUpdates when background toggle is pressed", () => {
    renderWithProviders(<MapActionButtons />);

    fireEvent.press(screen.getByTestId("background-toggle-button"));

    expect(mockToggleBackgroundLocation).toHaveBeenCalled();
  });

  it("should call toggleTheme when theme button is pressed", () => {
    renderWithProviders(<MapActionButtons />);

    fireEvent.press(screen.getByTestId("theme-toggle-button"));

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it("should call onRecenter when recenter button is pressed", () => {
    renderWithProviders(<MapActionButtons />);

    fireEvent.press(screen.getByTestId("recenter-button"));

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

    renderWithProviders(<MapActionButtons />);

    expect(screen.getByTestId("location-loading-indicator")).toBeOnTheScreen();
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

    renderWithProviders(<MapActionButtons />);

    expect(screen.getByTestId("background-loading-indicator")).toBeOnTheScreen();
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

    renderWithProviders(<MapActionButtons />);

    expect(screen.getByText("Background")).toBeOnTheScreen();

    const backgroundButton = screen.getByTestId("background-toggle-button");
    expect(backgroundButton).toBeDisabled();
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

    renderWithProviders(<MapActionButtons />);

    expect(screen.getByText("Background")).toBeOnTheScreen();
    expect(screen.getByText("Off")).toBeOnTheScreen();
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

    renderWithProviders(<MapActionButtons />);

    const locationButton = screen.getByTestId("location-toggle-button");
    expect(locationButton).toBeDisabled();
  });
});
