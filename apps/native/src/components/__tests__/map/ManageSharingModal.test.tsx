import React from "react";
import { ActivityIndicator } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ManageSharingModal } from "../../map/modals/ManageSharingModal";

const mockSetShowManageModal = jest.fn();
const mockHandleRemoveUser = jest.fn();

interface SharingUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

const mockGetMapOverlayStore = jest.fn(() => ({
  showManageModal: true,
  setShowManageModal: mockSetShowManageModal,
  sharingSettings: {
    usersToShareWith: [
      { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar1.jpg" },
      { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
    ] as SharingUser[],
  },
  isRemovingUser: false,
  handleRemoveUser: mockHandleRemoveUser,
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

interface MapModalShellProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
}

jest.mock("~/components/map/modals/MapModalShell", () => {
  const { createElement } = require("react");
  const { View, Text } = require("react-native");

  return {
    MapModalShell: function MockMapModalShell(props: MapModalShellProps) {
      if (!props.visible) return null;
      return createElement(View, { testID: "modal-shell" },
        createElement(Text, { testID: "modal-title" }, props.title),
        props.children
      );
    },
  };
});

interface MapModalUserItemProps {
  name: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

jest.mock("~/components/map/modals/MapModalUserItem", () => {
  const { createElement } = require("react");
  const { View, Text } = require("react-native");

  return {
    MapModalUserItem: function MockMapModalUserItem(props: MapModalUserItemProps) {
      return createElement(View, { testID: "user-item" },
        createElement(Text, { testID: "user-name" }, props.name),
        props.subtitle && createElement(Text, { testID: "user-subtitle" }, props.subtitle),
        props.rightElement
      );
    },
  };
});

describe("ManageSharingModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: true,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: {
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar1.jpg" },
          { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
        ] as SharingUser[],
      },
      isRemovingUser: false,
      handleRemoveUser: mockHandleRemoveUser,
    });
  });

  it("should render modal with title", () => {
    renderWithProviders(<ManageSharingModal />);

    const titleElement = screen.getByTestId("modal-title");
    expect(titleElement.children[0]).toBe("Manage Location Sharing");
  });

  it("should render list of users", () => {
    renderWithProviders(<ManageSharingModal />);

    const userItems = screen.getAllByTestId("user-item");
    expect(userItems.length).toBe(2);
  });

  it("should render user names", () => {
    renderWithProviders(<ManageSharingModal />);

    const userNames = screen.getAllByTestId("user-name");
    const firstUserName = userNames[0]?.children[0];
    const secondUserName = userNames[1]?.children[0];
    expect(firstUserName).toBe("John Doe");
    expect(secondUserName).toBe("Jane Smith");
  });

  it("should render remove buttons for each user", () => {
    renderWithProviders(<ManageSharingModal />);

    const removeButtons = screen.getAllByText("Remove");
    expect(removeButtons.length).toBe(2);
  });

  it("should call handleRemoveUser when remove button is pressed", async () => {
    renderWithProviders(<ManageSharingModal />);

    const user = userEvent.setup();
    const removeButton = screen.getAllByText("Remove")[0];
    if (!removeButton) {
      throw new Error("Remove button not found");
    }
    await user.press(removeButton);

    expect(mockHandleRemoveUser).toHaveBeenCalledWith("user-1");
  });

  it("should render empty state when no users", () => {
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: true,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: { usersToShareWith: [] },
      isRemovingUser: false,
      handleRemoveUser: mockHandleRemoveUser,
    });

    renderWithProviders(<ManageSharingModal />);

    expect(screen.getByText("You're not sharing your location with anyone")).toBeOnTheScreen();
  });

  it("should show loading indicator when removing user", () => {
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: true,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: {
        usersToShareWith: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }] as SharingUser[],
      },
      isRemovingUser: true,
      handleRemoveUser: mockHandleRemoveUser,
    });

    renderWithProviders(<ManageSharingModal />);

    expect(screen.getByTestId("remove-loading-indicator")).toBeOnTheScreen();
  });

  it("should handle user with partial name", () => {
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: true,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: {
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: undefined, image: null },
          { id: "user-2", firstName: undefined, lastName: "Doe", image: null },
        ] as SharingUser[],
      },
      isRemovingUser: false,
      handleRemoveUser: mockHandleRemoveUser,
    });

    renderWithProviders(<ManageSharingModal />);

    const userNames = screen.getAllByTestId("user-name");
    expect(userNames.length).toBe(2);
  });

  it("should not render when modal is not visible", () => {
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: false,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: { usersToShareWith: [] },
      isRemovingUser: false,
      handleRemoveUser: mockHandleRemoveUser,
    });

    renderWithProviders(<ManageSharingModal />);

    expect(screen.queryByTestId("modal-shell")).toBeNull();
  });
});
