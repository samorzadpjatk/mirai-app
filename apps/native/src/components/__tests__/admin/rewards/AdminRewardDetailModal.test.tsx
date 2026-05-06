import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import AdminRewardDetailModal from "../../../admin/rewards/AdminRewardDetailModal";
import * as ImagePicker from "expo-image-picker";
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from "react-native";

const mockMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
const mockSetHiddenMutateAsync = jest.fn();
const mockUpdatePurchaseStatusMutateAsync = jest.fn();
const mockUpload = jest.fn();
const mockOnClose = jest.fn();

jest.mock("react-native", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actualRN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    ...actualRN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

const mockReward = {
  id: "reward-123",
  name: "Test Reward",
  description: "A test reward description",
  availableQuantity: 50,
  coinCost: 10,
  originalCoinCost: 10,
  images: ["rewards/test-image.jpg"],
  isHidden: false,
  createdAt: "2024-01-15T10:00:00Z",
  createdBy: {
    firstName: "John",
    lastName: "Doe",
  },
  purchases: [
    {
      id: "purchase-1",
      status: "BOUGHT",
      quantity: 2,
      totalCost: 20,
      group: { name: "Test Group" },
      purchasedBy: {
        firstName: "Jane",
        lastName: "Smith",
      },
      purchasedAt: "2024-01-20T14:30:00Z",
      collectionMethod: null,
    },
  ],
  signedImageUrls: ["https://example.com/signed-image.jpg"],
};

const mockHiddenReward = {
  ...mockReward,
  id: "hidden-reward",
  isHidden: true,
};

const mockRewardWithMultiplePurchases = {
  ...mockReward,
  purchases: [
    {
      id: "purchase-1",
      status: "BOUGHT",
      quantity: 2,
      totalCost: 20,
      group: { name: "Group A" },
      purchasedBy: { firstName: "User", lastName: "One" },
      purchasedAt: "2024-01-20T14:30:00Z",
      collectionMethod: null,
    },
    {
      id: "purchase-2",
      status: "ACCEPTED",
      quantity: 1,
      totalCost: 10,
      group: { name: "Group B" },
      purchasedBy: { firstName: "User", lastName: "Two" },
      purchasedAt: "2024-01-21T10:00:00Z",
      collectionMethod: "Pick up at HQ",
    },
    {
      id: "purchase-3",
      status: "IN_DELIVERY",
      quantity: 3,
      totalCost: 30,
      group: { name: "Group C" },
      purchasedBy: { firstName: "User", lastName: "Three" },
      purchasedAt: "2024-01-22T16:45:00Z",
      collectionMethod: "Deliver to room",
    },
    {
      id: "purchase-4",
      status: "DELIVERED",
      quantity: 1,
      totalCost: 10,
      group: { name: "Group D" },
      purchasedBy: { firstName: "User", lastName: "Four" },
      purchasedAt: "2024-01-23T09:00:00Z",
      collectionMethod: "Picked up",
    },
    {
      id: "purchase-5",
      status: "CANCELLED",
      quantity: 2,
      totalCost: 20,
      group: { name: "Group E" },
      purchasedBy: { firstName: "User", lastName: "Five" },
      purchasedAt: "2024-01-24T11:30:00Z",
      collectionMethod: null,
    },
  ],
};

const mockRewardNoImages = {
  ...mockReward,
  images: [],
  signedImageUrls: [],
};

const mockRewardNoPurchases = {
  ...mockReward,
  purchases: [],
};

const mockRewardWithOriginalCost = {
  ...mockReward,
  originalCoinCost: 15,
  coinCost: 12,
};

const mockRewardUnknownGroup = {
  ...mockReward,
  purchases: [
    {
      ...mockReward.purchases[0],
      group: null,
    },
  ],
};

const mockRewardNoPurchaser = {
  ...mockReward,
  purchases: [
    {
      ...mockReward.purchases[0],
      purchasedBy: null,
    },
  ],
};

jest.mock("~/hooks/rewards", () => ({
  useReward: (id: string | null) => {
    if (!id) return { data: null, isLoading: false };
    if (id === "hidden-reward") return { data: mockHiddenReward, isLoading: false };
    if (id === "multi-purchase-reward")
      return { data: mockRewardWithMultiplePurchases, isLoading: false };
    if (id === "loading-reward") return { data: null, isLoading: true };
    if (id === "no-image-reward") return { data: mockRewardNoImages, isLoading: false };
    if (id === "no-purchases-reward") return { data: mockRewardNoPurchases, isLoading: false };
    if (id === "original-cost-reward") return { data: mockRewardWithOriginalCost, isLoading: false };
    if (id === "unknown-group-reward") return { data: mockRewardUnknownGroup, isLoading: false };
    if (id === "no-purchaser-reward") return { data: mockRewardNoPurchaser, isLoading: false };
    return { data: mockReward, isLoading: false };
  },
  useUpdateReward: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useDeleteReward: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useSetRewardHidden: () => ({
    mutateAsync: mockSetHiddenMutateAsync,
    isPending: false,
  }),
  useUpdateRewardPurchaseStatus: () => ({
    mutateAsync: mockUpdatePurchaseStatusMutateAsync,
    isPending: false,
  }),
}));

jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({
    upload: mockUpload,
    status: "idle",
  }),
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));

interface AppModalShellProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
  onClose: () => void;
}

interface AppModalFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  isPrimaryLoading: boolean;
  isPrimaryDisabled?: boolean;
  secondaryLabel: string;
  onSecondary: () => void;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  style?: object;
}

interface ThemedTextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: string;
  multiline?: boolean;
  editable?: boolean;
}

jest.mock("~/components/common/ui", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mockReact = jest.requireActual<typeof import("react")>("react");
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mockRN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    AppModalShell: function MockAppModalShell(props: AppModalShellProps) {
      if (!props.visible) return null;
      return mockReact.createElement(
        mockRN.View,
        { testID: "modal-shell" },
        mockReact.createElement(mockRN.Text, { testID: "modal-title" }, props.title),
        props.children
      );
    },
    AppModalFooter: function MockAppModalFooter(props: AppModalFooterProps) {
      return mockReact.createElement(
        mockRN.View,
        { testID: "modal-footer" },
        mockReact.createElement(
          mockRN.TouchableOpacity,
          {
            testID: "primary-button",
            onPress: props.onPrimary,
            disabled: props.isPrimaryDisabled,
          },
          mockReact.createElement(
            mockRN.Text,
            null,
            props.isPrimaryLoading ? "Loading..." : props.primaryLabel
          )
        ),
        mockReact.createElement(
          mockRN.TouchableOpacity,
          { testID: "secondary-button", onPress: props.onSecondary },
          mockReact.createElement(mockRN.Text, null, props.secondaryLabel)
        )
      );
    },
    FormField: function MockFormField(props: FormFieldProps) {
      return mockReact.createElement(
        mockRN.View,
        { testID: "form-field", style: props.style },
        mockReact.createElement(
          mockRN.Text,
          { testID: "field-label" },
          `${props.label}${props.required ? " *" : ""}`
        ),
        props.children
      );
    },
    ThemedTextInput: function MockThemedTextInput(props: ThemedTextInputProps) {
      return mockReact.createElement(mockRN.TextInput, {
        testID: "text-input",
        placeholder: props.placeholder,
        value: props.value,
        onChangeText: props.onChangeText,
        keyboardType: props.keyboardType,
        multiline: props.multiline,
        editable: props.editable,
      });
    },
  };
});

describe("AdminRewardDetailModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockDeleteMutateAsync.mockResolvedValue({});
    mockSetHiddenMutateAsync.mockResolvedValue({});
    mockUpdatePurchaseStatusMutateAsync.mockResolvedValue({});
    mockUpload.mockResolvedValue({});
  });

  const defaultProps = {
    rewardId: "reward-123",
    onClose: mockOnClose,
  };

  describe("rendering", () => {
    it("should render modal with title", () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByTestId("modal-title").children[0]).toBe("Reward Details");
    });

    it("should not render when rewardId is null", () => {
      const { queryByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId={null} />
      );
      expect(queryByTestId("modal-shell")).toBeNull();
    });

    it("should show loading state when data is loading", () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="loading-reward" />
      );
      const indicators = UNSAFE_getByType(ActivityIndicator);
      expect(indicators).toBeTruthy();
    });

    it("should render reward creation info", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByText(/Created:/)).toBeTruthy();
      expect(getByText(/John Doe/)).toBeTruthy();
    });

    it("should render hidden status for hidden rewards", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="hidden-reward" />
      );
      expect(getByText("Hidden from users")).toBeTruthy();
    });

    it("should render form fields", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByText("Name *")).toBeTruthy();
      expect(getByText("Description *")).toBeTruthy();
      expect(getByText("Available quantity *")).toBeTruthy();
      expect(getByText("Cost (% of total points) *")).toBeTruthy();
    });

    it("should render purchases section", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByText("Purchases")).toBeTruthy();
      expect(getByText("1 purchased")).toBeTruthy();
    });

    it("should render footer buttons", () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByTestId("primary-button")).toBeTruthy();
      expect(getByTestId("secondary-button")).toBeTruthy();
    });
  });

  describe("form interactions", () => {
    it("should populate form with reward data", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      expect(inputs[0].props.value).toBe("Test Reward");
      expect(inputs[1].props.value).toBe("A test reward description");
      expect(inputs[2].props.value).toBe("50");
      expect(inputs[3].props.value).toBe("10");
    });

    it("should update name field when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Updated Reward Name");
      expect(inputs[0].props.value).toBe("Updated Reward Name");
    });

    it("should update description field when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[1], "Updated description");
      expect(inputs[1].props.value).toBe("Updated description");
    });

    it("should update available quantity when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[2], "100");
      expect(inputs[2].props.value).toBe("100");
    });

    it("should update coin cost when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[3], "20");
      expect(inputs[3].props.value).toBe("20");
    });
  });

  describe("save functionality", () => {
    it("should show error when required fields are empty", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "");

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Fill in all required fields");
      });
    });

    it("should show error when coin cost is less than 1", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[3], "0");

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Cost must be between 1% and 100%");
      });
    });

    it("should show error when coin cost is greater than 100", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[3], "150");

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Cost must be between 1% and 100%");
      });
    });

    it("should successfully save reward with valid data", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Updated Reward");
      fireEvent.changeText(inputs[1], "Updated description");
      fireEvent.changeText(inputs[2], "75");
      fireEvent.changeText(inputs[3], "15");

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: "reward-123",
          name: "Updated Reward",
          description: "Updated description",
          availableQuantity: 75,
          coinCost: 15,
          images: ["rewards/test-image.jpg"],
        });
      });
    });

    it("should show success alert after saving", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Saved", "Reward has been updated");
      });
    });

    it("should call onClose after successful save", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should handle save error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Save failed"));

      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Save failed");
      });
    });
  });

  describe("delete functionality", () => {
    it("should show delete confirmation dialog", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByTestId("secondary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Delete reward",
          "Are you sure you want to delete this reward?",
          expect.any(Array)
        );
      });
    });

    it("should delete reward when confirmed", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      let alertCallbacks: { onPress?: () => void }[] = [];
      (Alert.alert as jest.Mock).mockImplementation((
        _title: string,
        _message: string,
        buttons?: { onPress?: () => void }[]
      ) => {
        alertCallbacks = buttons ?? [];
      });

      fireEvent.press(getByTestId("secondary-button"));

      await waitFor(() => {
        expect(alertCallbacks.length).toBeGreaterThan(0);
      });

      const deleteButton = alertCallbacks.find((b: { text?: string; onPress?: () => void }) => b.text === "Delete");
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: "reward-123" });
      });
    });

    it("should show success after deletion", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      let alertCallbacks: { onPress?: () => void }[] = [];
      (Alert.alert as jest.Mock).mockImplementation((
        _title: string,
        _message: string,
        buttons?: { onPress?: () => void }[]
      ) => {
        alertCallbacks = buttons ?? [];
      });

      fireEvent.press(getByTestId("secondary-button"));

      await waitFor(() => {
        const deleteButton = alertCallbacks.find((b: { text?: string; onPress?: () => void }) => b.text === "Delete");
        if (deleteButton?.onPress) {
          deleteButton.onPress();
        }
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Deleted", "Reward has been deleted");
      });
    });

    it("should call onClose after successful deletion", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      let alertCallbacks: { onPress?: () => void }[] = [];
      (Alert.alert as jest.Mock).mockImplementation((
        _title: string,
        _message: string,
        buttons?: { onPress?: () => void }[]
      ) => {
        alertCallbacks = buttons ?? [];
      });

      fireEvent.press(getByTestId("secondary-button"));

      await waitFor(() => {
        const deleteButton = alertCallbacks.find((b: { text?: string; onPress?: () => void }) => b.text === "Delete");
        if (deleteButton?.onPress) {
          deleteButton.onPress();
        }
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should handle delete error", async () => {
      mockDeleteMutateAsync.mockRejectedValue(new Error("Delete failed"));

      const { getByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      let alertCallbacks: { onPress?: () => void }[] = [];
      (Alert.alert as jest.Mock).mockImplementation((
        _title: string,
        _message: string,
        buttons?: { onPress?: () => void }[]
      ) => {
        alertCallbacks = buttons ?? [];
      });

      fireEvent.press(getByTestId("secondary-button"));

      await waitFor(() => {
        const deleteButton = alertCallbacks.find((b: { text?: string; onPress?: () => void }) => b.text === "Delete");
        if (deleteButton?.onPress) {
          deleteButton.onPress();
        }
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Delete failed");
      });
    });
  });

  describe("visibility toggle", () => {
    it("should show hide button for visible rewards", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByText("Hide reward")).toBeTruthy();
    });

    it("should show unhide button for hidden rewards", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="hidden-reward" />
      );
      expect(getByText("Unhide reward")).toBeTruthy();
    });

    it("should hide reward when hide button is pressed", async () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByText("Hide reward"));

      await waitFor(() => {
        expect(mockSetHiddenMutateAsync).toHaveBeenCalledWith({
          id: "reward-123",
          isHidden: true,
        });
      });
    });

    it("should unhide reward when unhide button is pressed", async () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="hidden-reward" />
      );

      fireEvent.press(getByText("Unhide reward"));

      await waitFor(() => {
        expect(mockSetHiddenMutateAsync).toHaveBeenCalledWith({
          id: "hidden-reward",
          isHidden: false,
        });
      });
    });

    it("should show success message after hiding", async () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByText("Hide reward"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Saved", "Reward has been hidden.");
      });
    });

    it("should show success message after unhiding", async () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="hidden-reward" />
      );

      fireEvent.press(getByText("Unhide reward"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Saved", "Reward is now visible.");
      });
    });
  });

  describe("purchase status management", () => {
    it("should render purchase with BOUGHT status", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByText("Bought")).toBeTruthy();
    });

    it("should render Accept button for BOUGHT status", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="multi-purchase-reward" />
      );
      expect(getByText("Accept")).toBeTruthy();
    });

    it("should render Cancel button for BOUGHT status", () => {
      const { getAllByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="multi-purchase-reward" />
      );
      expect(getAllByText("Cancel + refund").length).toBeGreaterThan(0);
    });

    it("should render Set in delivery button for ACCEPTED status", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="multi-purchase-reward" />
      );
      expect(getByText("Set in delivery")).toBeTruthy();
    });

    it("should render Mark delivered button for IN_DELIVERY status", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="multi-purchase-reward" />
      );
      expect(getByText("Mark delivered")).toBeTruthy();
    });

    it("should show error when accepting without collection method", async () => {
      const { getAllByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const acceptButton = getAllByText("Accept")[0];
      fireEvent.press(acceptButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Collection method required",
          "Provide pickup instructions before accepting."
        );
      });
    });

    it("should accept purchase with collection method", async () => {
      const { getAllByText, getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      const collectionInput = inputs.find(
        (input) =>
          input.props.placeholder ===
          "Collection method (e.g. pick up at HQ desk)"
      );

      if (collectionInput) {
        fireEvent.changeText(collectionInput, "Pick up at HQ");
      }

      const acceptButton = getAllByText("Accept")[0];
      fireEvent.press(acceptButton);

      await waitFor(() => {
        expect(mockUpdatePurchaseStatusMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "ACCEPTED",
            collectionMethod: "Pick up at HQ",
          })
        );
      });
    });

    it("should cancel purchase", async () => {
      const { getAllByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const cancelButtons = getAllByText("Cancel + refund");
      fireEvent.press(cancelButtons[0]);

      await waitFor(() => {
        expect(mockUpdatePurchaseStatusMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "CANCELLED",
          })
        );
      });
    });

    it("should show purchase details", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      expect(getByText(/2 pcs./)).toBeTruthy();
      expect(getByText(/20 coins/)).toBeTruthy();
      expect(getByText(/Test Group/)).toBeTruthy();
      expect(getByText(/Jane Smith/)).toBeTruthy();
    });

    it("should handle purchase without purchaser name", () => {
      const { queryByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="no-purchaser-reward" />
      );
      expect(queryByText(/Claimed by:/)).toBeNull();
    });
  });

  describe("image handling", () => {
    it("should render reward image when available", () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );
      const images = UNSAFE_getByType(Image);
      expect(images).toBeTruthy();
    });

    it("should handle image picker for changing image", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///new/image.jpg",
            fileName: "new-image.jpg",
            mimeType: "image/jpeg",
          },
        ],
      });

      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const changeImageButton = getByText("Change image");
      fireEvent.press(changeImageButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      });
    });

    it("should upload new image", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///new/image.jpg",
            fileName: "new-image.jpg",
            mimeType: "image/jpeg",
          },
        ],
      });

      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const changeImageButton = getByText("Change image");
      fireEvent.press(changeImageButton);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            storagePath: expect.stringContaining("rewards/"),
            fileUri: "file:///new/image.jpg",
            contentType: "image/jpeg",
          })
        );
      });
    });

    it("should handle image upload error", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///new/image.jpg",
            fileName: "new-image.jpg",
            mimeType: "image/jpeg",
          },
        ],
      });
      mockUpload.mockRejectedValue(new Error("Upload failed"));

      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const changeImageButton = getByText("Change image");
      fireEvent.press(changeImageButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Upload failed");
      });
    });

    it("should handle remove image", async () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const removeImageButton = getByText("Remove image");
      fireEvent.press(removeImageButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: "reward-123",
          images: [],
        });
      });
    });

    it("should show success after removing image", async () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const removeImageButton = getByText("Remove image");
      fireEvent.press(removeImageButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Deleted",
          "Reward image has been removed"
        );
      });
    });

    it("should handle remove image error", async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error("Remove failed"));

      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const removeImageButton = getByText("Remove image");
      fireEvent.press(removeImageButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Remove failed");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle reward without images", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="no-image-reward" />
      );
      expect(getByText("Add image")).toBeTruthy();
    });

    it("should handle reward with no purchases", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="no-purchases-reward" />
      );
      expect(getByText("0 purchased")).toBeTruthy();
    });

    it("should handle reward with originalCoinCost", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="original-cost-reward" />
      );
      const inputs = getAllByTestId("text-input");
      expect(inputs[3].props.value).toBe("15");
    });

    it("should handle purchase with unknown group", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mockRewardUnknownGroup = {
        ...mockReward,
        purchases: [
          {
            ...mockReward.purchases[0],
            group: null,
          },
        ],
      };

      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} rewardId="unknown-group-reward" />
      );
      expect(getByText(/Group:/)).toBeTruthy();
    });

    it("should handle purchase status update error", async () => {
      mockUpdatePurchaseStatusMutateAsync.mockRejectedValue(
        new Error("Status update failed")
      );

      const { getAllByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      const cancelButtons = getAllByText("Cancel + refund");
      fireEvent.press(cancelButtons[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Status update failed");
      });
    });

    it("should handle visibility toggle error", async () => {
      mockSetHiddenMutateAsync.mockRejectedValue(new Error("Toggle failed"));

      const { getByText } = renderWithProviders(
        <AdminRewardDetailModal {...defaultProps} />
      );

      fireEvent.press(getByText("Hide reward"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Toggle failed");
      });
    });
  });
});
