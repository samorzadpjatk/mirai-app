import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ShareLocationModal } from "../../map/modals/ShareLocationModal";

const mockSetSearchQuery = jest.fn();
const mockToggleSelectedUser = jest.fn();
const mockReset = jest.fn();
const mockCloseModal = jest.fn();
const mockConfirm = jest.fn();

const mockGetMapOverlayStore = jest.fn(() => ({
  shareModal: {
    open: true,
    searchQuery: "",
    selectedUsers: new Set<string>(),
    setSearchQuery: mockSetSearchQuery,
    toggleSelectedUser: mockToggleSelectedUser,
    reset: mockReset,
    closeModal: mockCloseModal,
    confirm: mockConfirm,
  },
  allAvailableUsers: [
    { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar1.jpg" },
    { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
    { id: "user-3", firstName: "Bob", lastName: "Wilson", image: null },
  ],
  sharingUserIds: ["user-2"],
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

jest.mock("~/components/map/modals/MapModalShell", () => ({
  MapModalShell: function MockMapModalShell({ children, visible }: {
    children: React.ReactNode;
    visible: boolean;
  }) {
    const React = require("react");
    const { View } = require("react-native");
    if (!visible) return null;
    return React.createElement(View, { testID: "modal-shell" }, children);
  },
}));

jest.mock("~/components/map/modals/MapModalUserItem", () => ({
  MapModalUserItem: function MockMapModalUserItem({
    name,
    subtitle,
    selected,
    onPress,
    rightElement,
  }: {
    name: string;
    subtitle?: string;
    selected?: boolean;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) {
    const React = require("react");
    const { View, Text, Pressable } = require("react-native");
    return React.createElement(
      Pressable,
      { testID: "user-item", onPress, "data-selected": selected },
      React.createElement(Text, { testID: "user-name" }, name),
      subtitle && React.createElement(Text, { testID: "user-subtitle" }, subtitle),
      rightElement
    );
  },
}));

jest.mock("~/components/common/ui", () => ({
  ThemedTextInput: function MockThemedTextInput({
    placeholder,
    value,
    onChangeText,
  }: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
  }) {
    const React = require("react");
    const { TextInput } = require("react-native");
    return React.createElement(TextInput, {
      testID: "search-input",
      placeholder,
      value,
      onChangeText,
    });
  },
}));

describe("ShareLocationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "",
        selectedUsers: new Set<string>(),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [
        { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar1.jpg" },
        { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
        { id: "user-3", firstName: "Bob", lastName: "Wilson", image: null },
      ],
      sharingUserIds: ["user-2"],
    });
  });

  it("should render modal when open", () => {
    const { getByTestId } = renderWithProviders(<ShareLocationModal />);

    expect(getByTestId("modal-shell")).toBeTruthy();
  });

  it("should render search input", () => {
    const { getByTestId } = renderWithProviders(<ShareLocationModal />);

    expect(getByTestId("search-input")).toBeTruthy();
  });

  it("should show empty state when search query is too short", () => {
    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("Type at least 2 characters to search for a person.")).toBeTruthy();
  });

  it("should call setSearchQuery when typing", () => {
    const { getByTestId } = renderWithProviders(<ShareLocationModal />);

    const searchInput = getByTestId("search-input");
    fireEvent.changeText(searchInput, "Jo");

    expect(mockSetSearchQuery).toHaveBeenCalledWith("Jo");
  });

  it("should show search results when query is valid", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Jo",
        selectedUsers: new Set<string>(),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [
        { id: "user-1", firstName: "John", lastName: "Doe", image: null },
        { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
      ],
      sharingUserIds: [],
    });

    const { getAllByTestId } = renderWithProviders(<ShareLocationModal />);

    const userItems = getAllByTestId("user-item");
    expect(userItems.length).toBeGreaterThan(0);
  });

  it("should show 'No matching users found' when search has no results", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "xyz",
        selectedUsers: new Set<string>(),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [
        { id: "user-1", firstName: "John", lastName: "Doe", image: null },
      ],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("No matching users found.")).toBeTruthy();
  });

  it("should show selected count when users are selected", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Jo",
        selectedUsers: new Set(["user-1"]),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("1 selected")).toBeTruthy();
  });

  it("should call reset when clear button is pressed", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Jo",
        selectedUsers: new Set(["user-1"]),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    fireEvent.press(getByText("Clear"));
    expect(mockReset).toHaveBeenCalled();
  });

  it("should show confirm button when users are selected", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Jo",
        selectedUsers: new Set(["user-1"]),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("Add 1 person")).toBeTruthy();
  });

  it("should call confirm when confirm button is pressed", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Jo",
        selectedUsers: new Set(["user-1"]),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    fireEvent.press(getByText("Add 1 person"));
    expect(mockConfirm).toHaveBeenCalled();
  });

  it("should show 'Already sharing' subtitle for users already being shared with", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Ja",
        selectedUsers: new Set<string>(),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-2", firstName: "Jane", lastName: "Smith", image: null }],
      sharingUserIds: ["user-2"],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("Already sharing")).toBeTruthy();
  });

  it("should show checkmark for already sharing users", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Ja",
        selectedUsers: new Set<string>(),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-2", firstName: "Jane", lastName: "Smith", image: null }],
      sharingUserIds: ["user-2"],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("✓")).toBeTruthy();
  });

  it("should show checkmark for selected users", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Jo",
        selectedUsers: new Set(["user-1"]),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("✓")).toBeTruthy();
  });

  it("should not allow selecting already sharing users", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "Ja",
        selectedUsers: new Set<string>(),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [{ id: "user-2", firstName: "Jane", lastName: "Smith", image: null }],
      sharingUserIds: ["user-2"],
    });

    const { getAllByTestId } = renderWithProviders(<ShareLocationModal />);

    const userItem = getAllByTestId("user-item")[0];
    fireEvent.press(userItem);

    expect(mockToggleSelectedUser).not.toHaveBeenCalled();
  });

  it("should show plural text for multiple selected users", () => {
    mockGetMapOverlayStore.mockReturnValue({
      shareModal: {
        open: true,
        searchQuery: "",
        selectedUsers: new Set(["user-1", "user-2"]),
        setSearchQuery: mockSetSearchQuery,
        toggleSelectedUser: mockToggleSelectedUser,
        reset: mockReset,
        closeModal: mockCloseModal,
        confirm: mockConfirm,
      },
      allAvailableUsers: [],
      sharingUserIds: [],
    });

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("2 selected")).toBeTruthy();
    expect(getByText("Add 2 people")).toBeTruthy();
  });
});
