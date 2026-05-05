import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SelectedUserCard } from "../../map/ui/SelectedUserCard";

jest.mock("@mirai-app/trpc", () => ({
  api: {},
  createTRPCClient: jest.fn(),
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
    onBackToList: mockBackToList,
    onStopSharing: mockStopSharing,
    users: [],
    currentUserId: undefined,
    showUsersList: false,
    isListExpanded: false,
    showManageModal: false,
    followMode: null,
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
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    expect(getByText("John")).toBeTruthy();
    expect(getByText("Doe")).toBeTruthy();
  });

  it("should render back button", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    expect(getByText("←")).toBeTruthy();
  });

  it("should call onBackToList when back button is pressed", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    fireEvent.press(getByText("←"));
    expect(mockBackToList).toHaveBeenCalledTimes(1);
  });

  it("should render last active section", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    expect(getByText("Last active")).toBeTruthy();
    expect(getByText("2 minutes ago")).toBeTruthy();
  });

  it("should render location sharing section", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    expect(getByText("Location Sharing")).toBeTruthy();
    expect(getByText("You share your location with this person")).toBeTruthy();
  });

  it("should render group section", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    expect(getByText("Group")).toBeTruthy();
    expect(getByText("-")).toBeTruthy();
  });

  it("should render stop sharing button when canStopSharing is true", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    expect(getByText("Stop Sharing My Location")).toBeTruthy();
  });

  it("should call onStopSharing when stop sharing button is pressed", () => {
    const { getByText } = renderWithProviders(<SelectedUserCard />);

    fireEvent.press(getByText("Stop Sharing My Location"));
    expect(mockStopSharing).toHaveBeenCalledTimes(1);
  });
});
