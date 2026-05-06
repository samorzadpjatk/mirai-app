import React from "react";
import { ActivityIndicator } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ProfileActionsSection } from "../../profile/ProfileActionsSection";

const mockSignOut = jest.fn(() => Promise.resolve());
const mockReplace = jest.fn();
const mockOnTogglePress = jest.fn();
const mockToggleLocationSharing = jest.fn(() => Promise.resolve());
const mockToggleBackgroundLocationUpdates = jest.fn(() => Promise.resolve());
const mockOpenSystemLocationSettings = jest.fn(() => Promise.resolve());

const mockUseNotifications = jest.fn(() => ({
  isSubscribed: false,
  isLoading: false,
  onTogglePress: mockOnTogglePress,
}));

const mockUseLocationContext = jest.fn(() => ({
  isLocationSharingEnabled: false,
  isLoading: false,
  toggleLocationSharing: mockToggleLocationSharing,
  isBackgroundLocationEnabled: false,
  isUpdatingBackgroundLocation: false,
  permissionStatus: "denied",
  backgroundPermissionStatus: "denied",
  toggleBackgroundLocationUpdates: mockToggleBackgroundLocationUpdates,
  openSystemLocationSettings: mockOpenSystemLocationSettings,
}));

jest.mock("@mirai-app/auth/client", () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("~/hooks/notifications", () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: (...args: unknown[]) => mockUseLocationContext(...args),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
    return <View testID={`icon-${name}`} style={{ width: size, height: size, color }} />;
  },
}));

describe("ProfileActionsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue({ isSubscribed: false, isLoading: false, onTogglePress: mockOnTogglePress });
    mockUseLocationContext.mockReturnValue({
      isLocationSharingEnabled: false,
      isLoading: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: false,
      isUpdatingBackgroundLocation: false,
      permissionStatus: "denied",
      backgroundPermissionStatus: "denied",
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocationUpdates,
      openSystemLocationSettings: mockOpenSystemLocationSettings,
    });
  });

  it("renders main actions", () => {
    const { getByText } = renderWithProviders(<ProfileActionsSection />);

    expect(getByText("Actions")).toBeTruthy();
    expect(getByText("Edit Profile")).toBeTruthy();
    expect(getByText("Enable Notifications")).toBeTruthy();
    expect(getByText("Enable Location Sharing")).toBeTruthy();
    expect(getByText("Background Location")).toBeTruthy();
    expect(getByText("Open system location settings")).toBeTruthy();
    expect(getByText("Sign Out")).toBeTruthy();
  });

  it("handles edit, notification and location actions", () => {
    const mockOnEditProfile = jest.fn();
    const { getByText } = renderWithProviders(<ProfileActionsSection onEditProfile={mockOnEditProfile} />);

    fireEvent.press(getByText("Edit Profile"));
    fireEvent.press(getByText("Enable Notifications"));
    fireEvent.press(getByText("Enable Location Sharing"));

    expect(mockOnEditProfile).toHaveBeenCalled();
    expect(mockOnTogglePress).toHaveBeenCalled();
    expect(mockToggleLocationSharing).toHaveBeenCalled();
  });

  it("shows enabled states and permission labels", () => {
    mockUseNotifications.mockReturnValue({ isSubscribed: true, isLoading: false, onTogglePress: mockOnTogglePress });
    mockUseLocationContext.mockReturnValue({
      isLocationSharingEnabled: true,
      isLoading: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: true,
      isUpdatingBackgroundLocation: false,
      permissionStatus: "granted",
      backgroundPermissionStatus: "granted",
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocationUpdates,
      openSystemLocationSettings: mockOpenSystemLocationSettings,
    });

    const { getByText, getAllByText } = renderWithProviders(<ProfileActionsSection />);

    expect(getByText("Notifications Enabled")).toBeTruthy();
    expect(getByText("Location Sharing Enabled")).toBeTruthy();
    expect(getByText("Access mode: Always")).toBeTruthy();
    expect(getAllByText("ON").length).toBeGreaterThanOrEqual(2);
  });

  it("shows disabled and loading background location state", () => {
    mockUseLocationContext.mockReturnValue({
      isLocationSharingEnabled: false,
      isLoading: false,
      toggleLocationSharing: mockToggleLocationSharing,
      isBackgroundLocationEnabled: false,
      isUpdatingBackgroundLocation: true,
      permissionStatus: "denied",
      backgroundPermissionStatus: "denied",
      toggleBackgroundLocationUpdates: mockToggleBackgroundLocationUpdates,
      openSystemLocationSettings: mockOpenSystemLocationSettings,
    });

    const { getByText, UNSAFE_getAllByType } = renderWithProviders(<ProfileActionsSection />);

    expect(getByText("Enable location sharing first")).toBeTruthy();
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThanOrEqual(1);
  });

  it("handles settings and sign out actions", async () => {
    const { getByText } = renderWithProviders(<ProfileActionsSection />);

    fireEvent.press(getByText("Open system location settings"));
    fireEvent.press(getByText("Sign Out"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockOpenSystemLocationSettings).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/auth/login");
  });
});
