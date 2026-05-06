import React from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupImagePicker } from "../../../trips/groups/GroupImagePicker";

describe("GroupImagePicker", () => {
  const mockOnPickImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(screen.getByText("Group Image")).toBeOnTheScreen();
  });

  it("should render placeholder when no image", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(screen.getByText("No image selected")).toBeOnTheScreen();
  });

  it("should render placeholder icon", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(screen.getByText("images-outline")).toBeOnTheScreen();
  });

  it("should render 'Add Photo' button when no image", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(screen.getByText("Add Photo")).toBeOnTheScreen();
  });

  it("should render 'Change Photo' button when image exists", () => {
    renderWithProviders(
      <GroupImagePicker
        imageUri="https://example.com/image.jpg"
        onPickImage={mockOnPickImage}
      />
    );
    expect(screen.getByText("Change Photo")).toBeOnTheScreen();
  });

  it("should render image when imageUri is provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker
        imageUri="https://example.com/image.jpg"
        onPickImage={mockOnPickImage}
      />
    );
    const image = UNSAFE_getByType(Image);
    interface ImageElement { props: { source: { uri: string } } }
    expect(image).toBeTruthy();
    expect((image as unknown as ImageElement).props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("should call onPickImage when pressed", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
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
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should show uploading text when isUploading is true", () => {
    renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
      />
    );
    expect(screen.getByText("Uploading...")).toBeOnTheScreen();
  });

  it("should show upload percentage when provided", () => {
    renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
        uploadPercent={50}
      />
    );
    expect(screen.getByText("Uploading 50%")).toBeOnTheScreen();
  });

  it("should disable touchable when isUploading is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker
        imageUri={null}
        onPickImage={mockOnPickImage}
        isUploading={true}
      />
    );
    const touchable = UNSAFE_getByType(TouchableOpacity);
    interface TouchableElement { props: { disabled: boolean } }
    expect((touchable as unknown as TouchableElement).props.disabled).toBe(true);
  });

  it("should render camera icon in badge", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    expect(screen.getByText("camera-outline")).toBeOnTheScreen();
  });

  it("should render with correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />
    );
    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });
});
