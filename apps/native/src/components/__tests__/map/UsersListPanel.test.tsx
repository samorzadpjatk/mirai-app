import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { Text as MockText, View as MockView, type StyleProp, type ViewStyle } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { UsersListPanel } from "../../map/panels/UsersListPanel";

const mockOnToggleExpand = jest.fn();
const mockOnAddPress = jest.fn();
const mockOnManagePress = jest.fn();
const mockHandleSelectUser = jest.fn();

const mockGetMapOverlayStore = jest.fn(() => ({
  users: [
    {
      id: "user-1",
      name: "John Doe",
      avatarUrl: "https://example.com/avatar1.jpg",
      lastActiveAt: new Date().toISOString(),
      address: "123 Main St",
    },
    {
      id: "user-2",
      name: "Jane Smith",
      avatarUrl: null,
      lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
      address: "456 Oak Ave",
    },
  ],
  currentUserId: "user-1",
  usersListStyle: {},
  onToggleExpand: mockOnToggleExpand,
  onAddPress: mockOnAddPress,
  onManagePress: mockOnManagePress,
  handleSelectUser: mockHandleSelectUser,
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size: number;
}

jest.mock("~/components/map/ui/UserAvatar", () => ({
  UserAvatar: ({ name, size }: UserAvatarProps) => (
    <MockView testID="user-avatar" style={{ width: size, height: size }}>
      <MockText>{name.charAt(0)}</MockText>
    </MockView>
  ),
}));

jest.mock("~/utils/format", () => ({
  formatRelativeTime: () => "2 hours ago",
}));

interface MockAnimatedViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: ({ children, style }: MockAnimatedViewProps) => (
      <MockView testID="animated-view" style={style}>
        {children}
      </MockView>
    ),
  },
}));

interface MockIoniconsProps {
  name: string;
  size: number;
  color: string;
}

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, size, color }: MockIoniconsProps) => (
    <MockView testID={`icon-${name}`} style={{ width: size, height: size }} />
  ),
}));

describe("UsersListPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMapOverlayStore.mockReturnValue({
      users: [
        {
          id: "user-1",
          name: "John Doe",
          avatarUrl: "https://example.com/avatar1.jpg",
          lastActiveAt: new Date().toISOString(),
          address: "123 Main St",
        },
        {
          id: "user-2",
          name: "Jane Smith",
          avatarUrl: null,
          lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
          address: "456 Oak Ave",
        },
      ],
      currentUserId: "user-1",
      usersListStyle: {},
      onToggleExpand: mockOnToggleExpand,
      onAddPress: mockOnAddPress,
      onManagePress: mockOnManagePress,
      handleSelectUser: mockHandleSelectUser,
    });
  });

  it("renders the panel title", () => {
    const { getByText } = renderWithProviders(<UsersListPanel />);

    expect(getByText("People")).toBeTruthy();
  });

  it("renders the correct action icons", () => {
    const { getByTestId } = renderWithProviders(<UsersListPanel />);

    expect(getByTestId("icon-settings-outline")).toBeTruthy();
    expect(getByTestId("icon-add")).toBeTruthy();
  });

  it("calls onToggleExpand when the header is pressed", () => {
    const { getByText } = renderWithProviders(<UsersListPanel />);
    const headerPressable = getByText("People").parent;

    if (!headerPressable) {
      throw new Error("Header pressable not found");
    }

    fireEvent.press(headerPressable);
    expect(mockOnToggleExpand).toHaveBeenCalled();
  });

  it("calls onManagePress when manage button is pressed", () => {
    const { getByTestId } = renderWithProviders(<UsersListPanel />);
    const manageButton = getByTestId("icon-settings-outline").parent;

    if (!manageButton) {
      throw new Error("Manage button not found");
    }

    fireEvent.press(manageButton, { stopPropagation: jest.fn() });
    expect(mockOnManagePress).toHaveBeenCalled();
  });

  it("calls onAddPress when add button is pressed", () => {
    const { getByTestId } = renderWithProviders(<UsersListPanel />);
    const addButton = getByTestId("icon-add").parent;

    if (!addButton) {
      throw new Error("Add button not found");
    }

    fireEvent.press(addButton, { stopPropagation: jest.fn() });
    expect(mockOnAddPress).toHaveBeenCalled();
  });

  it("renders user rows and current user labels", () => {
    const { getByText } = renderWithProviders(<UsersListPanel />);

    expect(getByText("Me")).toBeTruthy();
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("My Location")).toBeTruthy();
    expect(getByText("2 hours ago")).toBeTruthy();
    expect(getByText("123 Main St")).toBeTruthy();
    expect(getByText("456 Oak Ave")).toBeTruthy();
  });

  it("renders avatars for each user", () => {
    const { getAllByTestId } = renderWithProviders(<UsersListPanel />);

    expect(getAllByTestId("user-avatar")).toHaveLength(2);
  });

  it("calls onSelectUser for other users only", () => {
    const { getByText } = renderWithProviders(<UsersListPanel />);
    const otherUserRow = getByText("Jane Smith").parent?.parent?.parent;

    if (!otherUserRow) {
      throw new Error("Other user row not found");
    }

    fireEvent.press(otherUserRow);
    expect(mockHandleSelectUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-2", name: "Jane Smith" }),
    );

    const currentUserRow = getByText("Me").parent?.parent?.parent;

    if (!currentUserRow) {
      throw new Error("Current user row not found");
    }

    fireEvent.press(currentUserRow);
    expect(mockHandleSelectUser).toHaveBeenCalledTimes(1);
  });

  it("applies the animated style override", () => {
    mockGetMapOverlayStore.mockReturnValue({
      users: [],
      currentUserId: "user-1",
      usersListStyle: { opacity: 0.5 },
      onToggleExpand: mockOnToggleExpand,
      onAddPress: mockOnAddPress,
      onManagePress: mockOnManagePress,
      handleSelectUser: mockHandleSelectUser,
    });

    const { getByTestId } = renderWithProviders(<UsersListPanel />);

    const animatedView = getByTestId("animated-view");
    const animatedViewStyle = (
      animatedView.props as { style: [StyleProp<ViewStyle>, StyleProp<ViewStyle>] }
    ).style;

    expect(animatedViewStyle[0]).toEqual(expect.objectContaining({ overflow: "hidden" }));
    expect(animatedViewStyle[1]).toEqual({ opacity: 0.5 });
  });
});
