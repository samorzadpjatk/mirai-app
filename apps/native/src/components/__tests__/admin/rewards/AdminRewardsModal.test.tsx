import type React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import type * as ReactNative from "react-native";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import AdminRewardsModal from "../../../admin/rewards/AdminRewardsModal";
import { renderWithProviders } from "../../helpers/renderWithProviders";

interface UploadArgs {
  storagePath: string;
  fileUri: string;
  contentType: string;
}

const uploadedArgs: UploadArgs[] = [];
const mockOnClose = jest.fn();

const mockMutateAsync = jest.fn();
const mockUpload = jest.fn();

jest.mock("~/hooks/rewards", () => {
  return {
    useCreateReward: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

jest.mock("~/hooks/files", () => {
  return {
    useFileUpload: () => ({
      upload: mockUpload,
      status: "idle",
      progress: { percent: null, bytesUploaded: 0, bytesTotal: null },
    }),
  };
});

jest.mock("~/utils/image", () => ({
  getFileExtension: () => "jpg",
  getFileContentType: () => "image/jpeg",
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: { latitude: number; longitude: number }) => void;
}

const mockLaunchImageLibraryAsync = jest.mocked(ImagePicker.launchImageLibraryAsync);

jest.mock("~/components/map/LocationPicker", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  return {
    LocationPicker: ({ visible, onClose, onLocationSelected }: LocationPickerProps) =>
      !visible ? null : (
        <View>
          <TouchableOpacity
            onPress={() => onLocationSelected({ latitude: 52.2297, longitude: 21.0122 })}
          >
            <Text>Select Location</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text>Close Location Picker</Text>
          </TouchableOpacity>
        </View>
      ),
  };
});

describe("AdminRewardsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    uploadedArgs.length = 0;
    mockMutateAsync.mockResolvedValue({});
    mockUpload.mockImplementation((args: UploadArgs) => {
      uploadedArgs.push(args);
      return Promise.resolve({});
    });
  });

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    tripId: "trip-123",
  };

  describe("rendering", () => {
    it("should render modal with title", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("New Reward")).toBeTruthy();
    });

    it("should not render when not visible", () => {
      const { queryByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} visible={false} />,
      );
      expect(queryByTestId("app-modal")).toBeNull();
    });

    it("should render all form fields", () => {
      const { getAllByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      const formFields = getAllByTestId("form-field-container");
      expect(formFields.length).toBeGreaterThanOrEqual(4);
    });

    it("should render reward name field", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Reward name *")).toBeTruthy();
    });

    it("should render description field", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Description *")).toBeTruthy();
    });

    it("should render available quantity field", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Available quantity *")).toBeTruthy();
    });

    it("should render cost percentage field", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Cost (% of total points) *")).toBeTruthy();
    });

    it("should render visibility field", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Visibility")).toBeTruthy();
    });

    it("should render image upload field", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Reward images (optional)")).toBeTruthy();
    });

    it("should render footer buttons", () => {
      const { getByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByTestId("app-modal-footer-primary")).toBeTruthy();
      expect(getByTestId("app-modal-footer-secondary")).toBeTruthy();
    });
  });

  describe("form interactions", () => {
    it("should update reward name when typing", () => {
      const { getAllByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Branded T-shirt");
      expect(inputs[0]!.props.value).toBe("Branded T-shirt");
    });

    it("should update description when typing", () => {
      const { getAllByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[1]!, "A cool branded t-shirt");
      expect(inputs[1]!.props.value).toBe("A cool branded t-shirt");
    });

    it("should update available quantity when typing", () => {
      const { getAllByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[2]!, "50");
      expect(inputs[2]!.props.value).toBe("50");
    });

    it("should update coin cost when typing", () => {
      const { getAllByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[3]!, "10");
      expect(inputs[3]!.props.value).toBe("10");
    });

    it("should handle numeric keyboard for quantity field", () => {
      const { getAllByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      const inputs = getAllByTestId("themed-text-input");
      const numericInputs = inputs.filter((input) => input.props.keyboardType === "numeric");
      expect(numericInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("visibility toggle", () => {
    it("should have visible option", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Visible")).toBeTruthy();
    });

    it("should have hidden option", () => {
      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      expect(getByText("Hidden")).toBeTruthy();
    });
  });

  describe("form submission", () => {
    it("should show error when tripId is not provided", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} tripId={null} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Select a trip in the admin panel first");
      });
    });

    it("should show error when tripId is 'all'", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} tripId="all" />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Select a trip in the admin panel first");
      });
    });

    it("should show error when required fields are empty", async () => {
      const { getByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Fill in all required fields");
      });
    });

    it("should show error when coin cost is less than 1", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "0");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Cost must be between 1% and 100%");
      });
    });

    it("should show error when coin cost is greater than 100", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "150");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Cost must be between 1% and 100%");
      });
    });

    it("should show error when coin cost is not a number", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "abc");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Cost must be between 1% and 100%");
      });
    });

    it("should successfully create reward with valid data", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "A test description");
      fireEvent.changeText(inputs[2]!, "50");
      fireEvent.changeText(inputs[3]!, "10");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

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
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Success", "Reward has been created");
      });
    });

    it("should call onClose after successful creation", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should reset form after successful creation", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(inputs[0]!.props.value).toBe("");
        expect(inputs[1]!.props.value).toBe("");
        expect(inputs[2]!.props.value).toBe("");
        expect(inputs[3]!.props.value).toBe("");
      });
    });

    it("should handle creation error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Creation failed"));

      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to create reward");
      });
    });
  });

  describe("cancel action", () => {
    it("should call onClose when cancel button is pressed", () => {
      const { getByTestId } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);
      fireEvent.press(getByTestId("app-modal-footer-secondary"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("image handling", () => {
    it("should handle image picker cancellation", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: true,
        assets: null,
      });

      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);

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
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///test/image.jpg",
            fileName: "test-image.jpg",
            width: 100,
            height: 100,
            type: "image" as const,
          },
        ],
      });

      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);

      const addImagesButton = getByText("Add images");
      fireEvent.press(addImagesButton);

      await waitFor(() => {
        const uploadArgs = uploadedArgs[0]!;

        expect(uploadArgs.storagePath).toContain("rewards/");
        expect(uploadArgs.fileUri).toBe("file:///test/image.jpg");
        expect(uploadArgs.contentType).toBe("image/jpeg");
      });
    });

    it("should handle image upload error", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///test/image.jpg",
            fileName: "test-image.jpg",
            width: 100,
            height: 100,
            type: "image" as const,
          },
        ],
      });
      mockUpload.mockRejectedValue(new Error("Upload failed"));

      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);

      const addImagesButton = getByText("Add images");
      fireEvent.press(addImagesButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Upload error", "Upload failed");
      });
    });

    it("should handle multiple image selection", async () => {
      mockLaunchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///test/image1.jpg",
            fileName: "image1.jpg",
            width: 100,
            height: 100,
            type: "image" as const,
          },
          {
            uri: "file:///test/image2.jpg",
            fileName: "image2.jpg",
            width: 100,
            height: 100,
            type: "image" as const,
          },
        ],
      });

      const { getByText } = renderWithProviders(<AdminRewardsModal {...defaultProps} />);

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
        <AdminRewardsModal {...defaultProps} tripId="" />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Select a trip in the admin panel first");
      });
    });

    it("should handle coin cost of exactly 1", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "1");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ coinCost: 1 }));
      });
    });

    it("should handle coin cost of exactly 100", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "10");
      fireEvent.changeText(inputs[3]!, "100");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ coinCost: 100 }));
      });
    });

    it("should handle available quantity of 0", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "0");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ availableQuantity: 0 }),
        );
      });
    });

    it("should handle large available quantity", async () => {
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <AdminRewardsModal {...defaultProps} />,
      );

      const inputs = getAllByTestId("themed-text-input");
      fireEvent.changeText(inputs[0]!, "Test Reward");
      fireEvent.changeText(inputs[1]!, "Description");
      fireEvent.changeText(inputs[2]!, "999999");
      fireEvent.changeText(inputs[3]!, "5");

      fireEvent.press(getByTestId("app-modal-footer-primary"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ availableQuantity: 999999 }),
        );
      });
    });
  });
});
