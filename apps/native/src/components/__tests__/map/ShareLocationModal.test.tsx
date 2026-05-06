import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ShareLocationModal } from "../../map/modals/ShareLocationModal";

const mockSetSearchQuery = jest.fn();
const mockToggleSelectedUser = jest.fn();
const mockReset = jest.fn();
const mockCloseModal = jest.fn();
const mockConfirm = jest.fn();

interface ShareModalUser {
  id: string;
  firstName: string;
  lastName: string;
  image: string | null;
}

interface MapOverlayStore {
  shareModal: {
    open: boolean;
    searchQuery: string;
    selectedUsers: Set<string>;
    setSearchQuery: (query: string) => void;
    toggleSelectedUser: (userId: string) => void;
    reset: () => void;
    closeModal: () => void;
    confirm: () => void;
  };
  allAvailableUsers: ShareModalUser[];
  sharingUserIds: string[];
}

const createMockStore = (overrides: Partial<MapOverlayStore> = {}): MapOverlayStore => ({
  shareModal: {
    open: true,
    searchQuery: "",
    selectedUsers: new Set<string>(),
    setSearchQuery: mockSetSearchQuery,
    toggleSelectedUser: mockToggleSelectedUser,
    reset: mockReset,
    closeModal: mockCloseModal,
    confirm: mockConfirm,
    ...overrides.shareModal,
  },
  allAvailableUsers: [
    { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar1.jpg" },
    { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
    { id: "user-3", firstName: "Bob", lastName: "Wilson", image: null },
  ],
  sharingUserIds: ["user-2"],
  ...overrides,
});

const mockGetMapOverlayStore = jest.fn<MapOverlayStore, []>(() => createMockStore());

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

interface MapModalShellProps {
  children: React.ReactNode;
  visible: boolean;
}

jest.mock("~/components/map/modals/MapModalShell", () => ({
  MapModalShell: function MockMapModalShell({ children, visible }: MapModalShellProps) {
    const { View } = jest.requireActual("react-native");
    return visible ? <View testID="modal-shell">{children}</View> : null;
  },
}));

interface MapModalUserItemProps {
  name: string;
  subtitle?: string;
  selected?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

jest.mock("~/components/map/modals/MapModalUserItem", () => ({
  MapModalUserItem: function MockMapModalUserItem({
    name,
    subtitle,
    selected,
    onPress,
    rightElement,
  }: MapModalUserItemProps) {
    const { Pressable, Text } = jest.requireActual("react-native");
    return (
      <Pressable testID="user-item" onPress={onPress} data-selected={selected}>
        <Text testID="user-name">{name}</Text>
        {subtitle ? <Text testID="user-subtitle">{subtitle}</Text> : null}
        {rightElement}
      </Pressable>
    );
  },
}));

interface ThemedTextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

jest.mock("~/components/common/ui", () => ({
  ThemedTextInput: function MockThemedTextInput({
    placeholder,
    value,
    onChangeText,
  }: ThemedTextInputProps) {
    const { TextInput } = jest.requireActual("react-native");
    return (
      <TextInput
        testID="search-input"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    );
  },
}));

describe("ShareLocationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMapOverlayStore.mockReturnValue(createMockStore());
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
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getAllByTestId } = renderWithProviders(<ShareLocationModal />);

    const userItems = getAllByTestId("user-item");
    expect(userItems.length).toBeGreaterThan(0);
  });

  it("should show 'No matching users found' when search has no results", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
        allAvailableUsers: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
        sharingUserIds: [],
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("No matching users found.")).toBeTruthy();
  });

  it("should show selected count when users are selected", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("1 selected")).toBeTruthy();
  });

  it("should call reset when clear button is pressed", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    fireEvent.press(getByText("Clear"));
    expect(mockReset).toHaveBeenCalled();
  });

  it("should show confirm button when users are selected", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("Add 1 person")).toBeTruthy();
  });

  it("should call confirm when confirm button is pressed", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    fireEvent.press(getByText("Add 1 person"));
    expect(mockConfirm).toHaveBeenCalled();
  });

  it("should show 'Already sharing' subtitle for users already being shared with", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("Already sharing")).toBeTruthy();
  });

  it("should show checkmark for already sharing users", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("✓")).toBeTruthy();
  });

  it("should show checkmark for selected users", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("✓")).toBeTruthy();
  });

  it("should not allow selecting already sharing users", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getAllByTestId } = renderWithProviders(<ShareLocationModal />);

    const userItem = getAllByTestId("user-item")[0];
    fireEvent.press(userItem);

    expect(mockToggleSelectedUser).not.toHaveBeenCalled();
  });

  it("should show plural text for multiple selected users", () => {
    mockGetMapOverlayStore.mockReturnValue(
      createMockStore({
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
      })
    );

    const { getByText } = renderWithProviders(<ShareLocationModal />);

    expect(getByText("2 selected")).toBeTruthy();
    expect(getByText("Add 2 people")).toBeTruthy();
  });
});
