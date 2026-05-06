import React from "react";
import { ActivityIndicator } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ManageSharingModal } from "../../map/modals/ManageSharingModal";

const mockSetShowManageModal = jest.fn();
const mockHandleRemoveUser = jest.fn();

const mockGetMapOverlayStore = jest.fn(() => ({
  showManageModal: true,
  setShowManageModal: mockSetShowManageModal,
  sharingSettings: {
    usersToShareWith: [
      { id: "user-1", firstName: "John", lastName: "Doe", image: "https://example.com/avatar1.jpg" },
      { id: "user-2", firstName: "Jane", lastName: "Smith", image: null },
    ],
  },
  isRemovingUser: false,
  handleRemoveUser: mockHandleRemoveUser,
}));

jest.mock("~/stores/map", () => ({
  useMapOverlayStore: () => mockGetMapOverlayStore(),
}));

jest.mock("~/components/map/modals/MapModalShell", () => {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
  const { createElement } = require("react");
  const { View, Text } = require("react-native");

  return {
    MapModalShell: function MockMapModalShell(props) {
      if (!props.visible) return null;
      return createElement(View, { testID: "modal-shell" },
        createElement(Text, { testID: "modal-title" }, props.title),
        props.children
      );
    },
  };
  /* eslint-enable */
});

jest.mock("~/components/map/modals/MapModalUserItem", () => {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
  const { createElement } = require("react");
  const { View, Text } = require("react-native");

  return {
    MapModalUserItem: function MockMapModalUserItem(props) {
      return createElement(View, { testID: "user-item" },
        createElement(Text, { testID: "user-name" }, props.name),
        props.subtitle && createElement(Text, { testID: "user-subtitle" }, props.subtitle),
        props.rightElement
      );
    },
  };
  /* eslint-enable */
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
        ],
      },
      isRemovingUser: false,
      handleRemoveUser: mockHandleRemoveUser,
    });
  });

  it("should render modal with title", () => {
    const { getByTestId } = renderWithProviders(<ManageSharingModal />);

    expect(getByTestId("modal-title").children[0]).toBe("Manage Location Sharing");
  });

  it("should render list of users", () => {
    const { getAllByTestId } = renderWithProviders(<ManageSharingModal />);

    const userItems = getAllByTestId("user-item");
    expect(userItems.length).toBe(2);
  });

  it("should render user names", () => {
    const { getAllByTestId } = renderWithProviders(<ManageSharingModal />);

    const userNames = getAllByTestId("user-name");
    expect(userNames[0].children[0]).toBe("John Doe");
    expect(userNames[1].children[0]).toBe("Jane Smith");
  });

  it("should render remove buttons for each user", () => {
    const { getAllByText } = renderWithProviders(<ManageSharingModal />);

    const removeButtons = getAllByText("Remove");
    expect(removeButtons.length).toBe(2);
  });

  it("should call handleRemoveUser when remove button is pressed", () => {
    const { getAllByText } = renderWithProviders(<ManageSharingModal />);

    const removeButtons = getAllByText("Remove");
    fireEvent.press(removeButtons[0]);

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

    const { getByText } = renderWithProviders(<ManageSharingModal />);

    expect(getByText("You're not sharing your location with anyone")).toBeTruthy();
  });

  it("should show loading indicator when removing user", () => {
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: true,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: {
        usersToShareWith: [{ id: "user-1", firstName: "John", lastName: "Doe", image: null }],
      },
      isRemovingUser: true,
      handleRemoveUser: mockHandleRemoveUser,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<ManageSharingModal />);

    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(activityIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it("should handle user with partial name", () => {
    mockGetMapOverlayStore.mockReturnValue({
      showManageModal: true,
      setShowManageModal: mockSetShowManageModal,
      sharingSettings: {
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: null, image: null },
          { id: "user-2", firstName: null, lastName: "Doe", image: null },
        ],
      },
      isRemovingUser: false,
      handleRemoveUser: mockHandleRemoveUser,
    });

    const { getAllByTestId } = renderWithProviders(<ManageSharingModal />);

    const userNames = getAllByTestId("user-name");
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

    const { queryByTestId } = renderWithProviders(<ManageSharingModal />);

    expect(queryByTestId("modal-shell")).toBeNull();
  });
});
