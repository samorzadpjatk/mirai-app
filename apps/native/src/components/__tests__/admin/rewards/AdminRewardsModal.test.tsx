import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import AdminRewardsModal from "../../../admin/rewards/AdminRewardsModal";
import * as ImagePicker from "expo-image-picker";

const mockMutateAsync = jest.fn();
const mockUpload = jest.fn();
const mockOnClose = jest.fn();

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock("~/hooks/rewards", () => ({
  useCreateReward: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({
    upload: mockUpload,
    status: "idle",
    progress: { percent: null, bytesUploaded: 0, bytesTotal: null },
  }),
}));

jest.mock("~/utils/image", () => ({
  getImageExtension: () => "jpg",
  getImageContentType: () => "image/jpeg",
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("~/components/common/ui", () => ({
  AppModalShell: function MockAppModalShell(props: {
    children: React.ReactNode;
    visible: boolean;
    title: string;
    onClose: () => void;
  }) {
    const React = require("react");
    const { View, Text } = require("react-native");
    if (!props.visible) return null;
    return React.createElement(
      View,
      { testID: "modal-shell" },
      React.createElement(Text, { testID: "modal-title" }, props.title),
      props.children
    );
  },
  AppModalFooter: function MockAppModalFooter(props: {
    primaryLabel: string;
    onPrimary: () => void;
    isPrimaryLoading: boolean;
    secondaryLabel: string;
    onSecondary: () => void;
  }) {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return React.createElement(
      View,
      { testID: "modal-footer" },
      React.createElement(
        TouchableOpacity,
        { testID: "primary-button", onPress: props.onPrimary },
        React.createElement(
          Text,
          null,
          props.isPrimaryLoading ? "Loading..." : props.primaryLabel
        )
      ),
      React.createElement(
        TouchableOpacity,
        { testID: "secondary-button", onPress: props.onSecondary },
        React.createElement(Text, null, props.secondaryLabel)
      )
    );
  },
  FormField: function MockFormField(props: {
    children: React.ReactNode;
    label: string;
    required?: boolean;
    style?: object;
  }) {
    const React = require("react");
    const { View, Text } = require("react-native");
    return React.createElement(
      View,
      { testID: "form-field", style: props.style },
      React.createElement(
        Text,
        { testID: "field-label" },
        `${props.label}${props.required ? " *" : ""}`
      ),
      props.children
    );
  },
  ThemedTextInput: function MockThemedTextInput(props: {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: string;
    multiline?: boolean;
  }) {
    const React = require("react");
    const { TextInput } = require("react-native");
    return React.createElement(TextInput, {
      testID: "text-input",
      placeholder: props.placeholder,
      value: props.value,
      onChangeText: props.onChangeText,
      keyboardType: props.keyboardType,
      multiline: props.multiline,
    });
  },
}));

describe("AdminRewardsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockUpload.mockResolvedValue({});
  });

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    tripId: "trip-123",
  };

  describe("rendering", () => {
    it("should render modal with title", () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByTestId("modal-title").children[0]).toBe("New Reward");
    });

    it("should not render when not visible", () => {
      const { queryByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} visible={false} />
      );
      expect(queryByTestId("modal-shell")).toBeNull();
    });

    it("should render all form fields", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      const formFields = getAllByTestId("form-field");
      expect(formFields.length).toBeGreaterThanOrEqual(4);
    });

    it("should render reward name field", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Reward name *")).toBeTruthy();
    });

    it("should render description field", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Description *")).toBeTruthy();
    });

    it("should render available quantity field", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Available quantity *")).toBeTruthy();
    });

    it("should render cost percentage field", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Cost (% of total points) *")).toBeTruthy();
    });

    it("should render visibility field", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Visibility")).toBeTruthy();
    });

    it("should render image upload field", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Reward images (optional)")).toBeTruthy();
    });

    it("should render footer buttons", () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByTestId("primary-button")).toBeTruthy();
      expect(getByTestId("secondary-button")).toBeTruthy();
    });
  });

  describe("form interactions", () => {
    it("should update reward name when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Branded T-shirt");
      expect(inputs[0].props.value).toBe("Branded T-shirt");
    });

    it("should update description when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[1], "A cool branded t-shirt");
      expect(inputs[1].props.value).toBe("A cool branded t-shirt");
    });

    it("should update available quantity when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[2], "50");
      expect(inputs[2].props.value).toBe("50");
    });

    it("should update coin cost when typing", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[3], "10");
      expect(inputs[3].props.value).toBe("10");
    });

    it("should handle numeric keyboard for quantity field", () => {
      const { getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      const inputs = getAllByTestId("text-input");
      const numericInputs = inputs.filter(
        (input) => input.props.keyboardType === "numeric"
      );
      expect(numericInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("visibility toggle", () => {
    it("should have visible option", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Visible")).toBeTruthy();
    });

    it("should have hidden option", () => {
      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      expect(getByText("Hidden")).toBeTruthy();
    });
  });

  describe("form submission", () => {
    it("should show error when tripId is not provided", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} tripId={null} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Select a trip in the admin panel first"
        );
      });
    });

    it("should show error when tripId is 'all'", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} tripId="all" />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Select a trip in the admin panel first"
        );
      });
    });

    it("should show error when required fields are empty", async () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Fill in all required fields");
      });
    });

    it("should show error when coin cost is less than 1", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "0");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Cost must be between 1% and 100%"
        );
      });
    });

    it("should show error when coin cost is greater than 100", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "150");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Cost must be between 1% and 100%"
        );
      });
    });

    it("should show error when coin cost is not a number", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "abc");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Cost must be between 1% and 100%"
        );
      });
    });

    it("should successfully create reward with valid data", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "A test description");
      fireEvent.changeText(inputs[2], "50");
      fireEvent.changeText(inputs[3], "10");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "Test Reward",
          description: "A test description",
          availableQuantity: 50,
          coinCost: 10,
          images: [],
          isHidden: false,
          tripId: "trip-123",
        });
      });
    });

    it("should show success alert after creating reward", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Success", "Reward has been created");
      });
    });

    it("should call onClose after successful creation", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should reset form after successful creation", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(inputs[0].props.value).toBe("");
        expect(inputs[1].props.value).toBe("");
        expect(inputs[2].props.value).toBe("");
        expect(inputs[3].props.value).toBe("");
      });
    });

    it("should handle creation error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Creation failed"));

      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to create reward");
      });
    });
  });

  describe("cancel action", () => {
    it("should call onClose when cancel button is pressed", () => {
      const { getByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );
      fireEvent.press(getByTestId("secondary-button"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("image handling", () => {
    it("should handle image picker cancellation", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const addImagesButton = getByText("Add images");
      fireEvent.press(addImagesButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: "images",
          allowsEditing: false,
          allowsMultipleSelection: true,
          quality: 0.8,
        });
      });
    });

    it("should handle image upload success", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///test/image.jpg",
            fileName: "test-image.jpg",
          },
        ],
      });

      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const addImagesButton = getByText("Add images");
      fireEvent.press(addImagesButton);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.objectContaining({
            storagePath: expect.stringContaining("rewards/"),
            fileUri: "file:///test/image.jpg",
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
            uri: "file:///test/image.jpg",
            fileName: "test-image.jpg",
          },
        ],
      });
      mockUpload.mockRejectedValue(new Error("Upload failed"));

      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const { Alert } = require("react-native");
      const addImagesButton = getByText("Add images");
      fireEvent.press(addImagesButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Upload error", "Upload failed");
      });
    });

    it("should handle multiple image selection", async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          { uri: "file:///test/image1.jpg", fileName: "image1.jpg" },
          { uri: "file:///test/image2.jpg", fileName: "image2.jpg" },
        ],
      });

      const { getByText } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const addImagesButton = getByText("Add images");
      fireEvent.press(addImagesButton);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty tripId string", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} tripId="" />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Select a trip in the admin panel first"
        );
      });
    });

    it("should handle coin cost of exactly 1", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "1");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ coinCost: 1 })
        );
      });
    });

    it("should handle coin cost of exactly 100", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "10");
      fireEvent.changeText(inputs[3], "100");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ coinCost: 100 })
        );
      });
    });

    it("should handle available quantity of 0", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "0");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ availableQuantity: 0 })
        );
      });
    });

    it("should handle large available quantity", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />
      );

      const inputs = getAllByTestId("text-input");
      fireEvent.changeText(inputs[0], "Test Reward");
      fireEvent.changeText(inputs[1], "Description");
      fireEvent.changeText(inputs[2], "999999");
      fireEvent.changeText(inputs[3], "5");

      const { Alert } = require("react-native");
      fireEvent.press(getByTestId("primary-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ availableQuantity: 999999 })
        );
      });
    });
  });
});
