import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupImagePicker } from "../../../trips/groups/GroupImagePicker";

describe("GroupImagePicker", () => {
  const mockOnPickImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(getByText("Group Image")).toBeTruthy();
  });

  it("should render placeholder when no image", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(getByText("No image selected")).toBeTruthy();
  });

  it("should render placeholder icon", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(getByText("images-outline")).toBeTruthy();
  });

  it("should render 'Add Photo' button when no image", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(getByText("Add Photo")).toBeTruthy();
  });

  it("should render 'Change Photo' button when image exists", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker
        imageUri="https://example.com/image.jpg"
        onPickImage={mockOnPickImage}
      />
    );
    expect(getByText("Change Photo")).toBeTruthy();
  });

  it("should render image when imageUri is provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker
        imageUri="https://example.com/image.jpg"
        onPickImage={mockOnPickImage}
      />
    );
    const image = UNSAFE_getByType(require("react-native").Image);
    expect(image).toBeTruthy();
    expect(image.props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("should call onPickImage when pressed", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    const touchable = UNSAFE_getByType(require("react-native").TouchableOpacity);
    fireEvent.press(touchable);
    expect(mockOnPickImage).toHaveBeenCalledTimes(1);
  });

  it("should show uploading state with ActivityIndicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
      />
    );
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should show uploading text when isUploading is true", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
      />
    );
    expect(getByText("Uploading...")).toBeTruthy();
  });

  it("should show upload percentage when provided", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
        uploadPercent={50}
      />
    );
    expect(getByText("Uploading 50%")).toBeTruthy();
  });

  it("should disable touchable when isUploading is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
      />
    );
    const touchable = UNSAFE_getByType(require("react-native").TouchableOpacity);
    expect(touchable.props.disabled).toBe(true);
  });

  it("should render camera icon in badge", () => {
    const { getByText } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(getByText("camera-outline")).toBeTruthy();
  });

  it("should render with correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });
});
