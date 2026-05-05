import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { UsersListPanel } from "../../map/panels/UsersListPanel";

const mockOnToggleExpand = jest.fn();
const mockOnAddPress = jest.fn();
const mockOnManagePress = jest.fn();
const mockOnSelectUser = jest.fn();

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
  onSelectUser: mockOnSelectUser,
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

jest.mock("~/components/map/ui/UserAvatar", () => ({
  UserAvatar: function MockUserAvatar(props: { name: string; imageUrl?: string | null; size: number }) {
    const React = require("react");
    const { View, Text } = require("react-native");
    return React.createElement(
      View,
      { testID: "user-avatar", style: { width: props.size, height: props.size } },
      React.createElement(Text, null, props.name.charAt(0))
    );
  },
}));

jest.mock("~/utils/format", () => ({
  formatRelativeTime: () => "2 hours ago",
}));

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: function MockAnimatedView({ children, style }: { children?: React.ReactNode; style?: object }) {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, { testID: "animated-view", style }, children);
    },
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: `icon-${name}`, style: { width: size, height: size, color } });
  },
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
      onSelectUser: mockOnSelectUser,
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

    fireEvent.press(getByText("People").parent as any);
    expect(mockOnToggleExpand).toHaveBeenCalled();
  });

  it("calls onManagePress when manage button is pressed", () => {
    const { getByTestId } = renderWithProviders(<UsersListPanel />);

    fireEvent.press(getByTestId("icon-settings-outline").parent as any, { stopPropagation: jest.fn() });
    expect(mockOnManagePress).toHaveBeenCalled();
  });

  it("calls onAddPress when add button is pressed", () => {
    const { getByTestId } = renderWithProviders(<UsersListPanel />);

    fireEvent.press(getByTestId("icon-add").parent as any, { stopPropagation: jest.fn() });
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

    fireEvent.press(getByText("Jane Smith").parent?.parent?.parent as any);
    expect(mockOnSelectUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-2", name: "Jane Smith" })
    );

    fireEvent.press(getByText("Me").parent?.parent?.parent as any);
    expect(mockOnSelectUser).toHaveBeenCalledTimes(1);
  });

  it("applies the animated style override", () => {
    mockGetMapOverlayStore.mockReturnValue({
      users: [],
      currentUserId: "user-1",
      usersListStyle: { opacity: 0.5 },
      onToggleExpand: mockOnToggleExpand,
      onAddPress: mockOnAddPress,
      onManagePress: mockOnManagePress,
      onSelectUser: mockOnSelectUser,
    });

    const { getByTestId } = renderWithProviders(<UsersListPanel />);

    const animatedView = getByTestId("animated-view");
    expect(animatedView.props.style[0]).toEqual(expect.objectContaining({ overflow: "hidden" }));
    expect(animatedView.props.style[1]).toEqual({ opacity: 0.5 });
  });
});
