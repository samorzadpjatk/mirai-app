import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import { SelectedUserCard } from "../../map/ui/SelectedUserCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

jest.mock("@mirai-app/orpc", () => ({
  api: {},
  createORPCClient: jest.fn(),
  createQueryClient: jest.fn(),
}));

jest.mock("~/utils/format", () => ({
  formatRelativeTime: () => "2 minutes ago",
}));

jest.mock("~/components/map/ui/UserAvatar", () => ({
  UserAvatar: jest.fn(() => null),
}));

const mockBackToList = jest.fn();
const mockStopSharing = jest.fn();

jest.mock("~/stores/map", () => ({
  mapStore: {},
  useMapStore: jest.fn(),
  useMapActions: jest.fn(),
  useMapOverlayStore: jest.fn(() => ({
    selectedUser: {
      id: "user-1",
      name: "John Doe",
      avatarUrl: "https://example.com/avatar.jpg",
      lastActiveAt: new Date().toISOString(),
      coordinate: [52.2297, 21.0122],
    },
    sharingUserIds: ["user-1"],
    canStopSharing: true,
    handleBackToList: mockBackToList,
    handleStopSharing: mockStopSharing,
    users: [],
    currentUserId: undefined,
    showUsersList: false,
    isListExpanded: false,
    showManageModal: false,
    followMode: "none",
    focusedCoordinate: null,
    mapTheme: "dark",
    allAvailableUsers: undefined,
    sharingSettings: undefined,
    isRemovingUser: false,
    panelStyle: {},
    usersListStyle: {},
    panGesture: {},
    onToggleExpand: jest.fn(),
    onAddPress: jest.fn(),
    onManagePress: jest.fn(),
    onSelectUser: jest.fn(),
    shareModal: { isOpen: false, openModal: jest.fn(), closeModal: jest.fn() },
    onRecenter: jest.fn(),
    onMapUserPress: jest.fn(),
    onMapPress: jest.fn(),
    handleRemoveUser: jest.fn(),
    selectUser: jest.fn(),
    deselectUser: jest.fn(),
    backToList: mockBackToList,
    toggleListExpansion: jest.fn(),
    collapseList: jest.fn(),
    setShowManageModal: jest.fn(),
    setFollowMode: jest.fn(),
    setFocusedCoordinate: jest.fn(),
    toggleTheme: jest.fn(),
    recenter: jest.fn(),
    handleMapUserPress: jest.fn(),
    handleMapPress: jest.fn(),
    setUsers: jest.fn(),
    setCurrentUserId: jest.fn(),
    setSharingUserIds: jest.fn(),
    setAllAvailableUsers: jest.fn(),
    setSharingSettings: jest.fn(),
    setIsRemovingUser: jest.fn(),
  })),
  mapOverlayStore: {},
  MapOverlayProvider: ({ children }: { children: React.ReactNode }) => children,
  setMapOverlayExternals: jest.fn(),
}));

describe("SelectedUserCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render user information when selectedUser exists", () => {
    renderWithProviders(<SelectedUserCard />);

    expect(screen.getByText("John")).toBeOnTheScreen();
    expect(screen.getByText("Doe")).toBeOnTheScreen();
  });

  it("should render back button", () => {
    renderWithProviders(<SelectedUserCard />);

    expect(screen.getByText("←")).toBeOnTheScreen();
  });

  it("should call onBackToList when back button is pressed", () => {
    renderWithProviders(<SelectedUserCard />);

    fireEvent.press(screen.getByText("←"));
    expect(mockBackToList).toHaveBeenCalledTimes(1);
  });

  it("should render last active section", () => {
    renderWithProviders(<SelectedUserCard />);

    expect(screen.getByText("Last active")).toBeOnTheScreen();
    expect(screen.getByText("2 minutes ago")).toBeOnTheScreen();
  });

  it("should render location sharing section", () => {
    renderWithProviders(<SelectedUserCard />);

    expect(screen.getByText("Location Sharing")).toBeOnTheScreen();
    expect(screen.getByText("You share your location with this person")).toBeOnTheScreen();
  });

  it("should render group section", () => {
    renderWithProviders(<SelectedUserCard />);

    expect(screen.getByText("Group")).toBeOnTheScreen();
    expect(screen.getByText("-")).toBeOnTheScreen();
  });

  it("should render stop sharing button when canStopSharing is true", () => {
    renderWithProviders(<SelectedUserCard />);

    expect(screen.getByText("Stop Sharing My Location")).toBeOnTheScreen();
  });

  it("should call onStopSharing when stop sharing button is pressed", () => {
    renderWithProviders(<SelectedUserCard />);

    fireEvent.press(screen.getByText("Stop Sharing My Location"));
    expect(mockStopSharing).toHaveBeenCalledTimes(1);
  });
});
