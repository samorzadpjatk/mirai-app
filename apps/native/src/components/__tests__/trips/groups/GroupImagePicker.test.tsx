import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupImagePicker } from "../../../trips/groups/GroupImagePicker";

describe("GroupImagePicker", () => {
  const mockOnPickImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render label", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    expect(screen.getByText("Group Image")).toBeOnTheScreen();
  });

  it("should render placeholder when no image", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    expect(screen.getByText("No image selected")).toBeOnTheScreen();
  });

  it("should render placeholder icon", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    expect(screen.getByText("images-outline")).toBeOnTheScreen();
  });

  it("should render 'Add Photo' button when no image", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    expect(screen.getByText("Add Photo")).toBeOnTheScreen();
  });

  it("should render 'Change Photo' button when image exists", () => {
    renderWithProviders(
      <GroupImagePicker imageUri="https://example.com/image.jpg" onPickImage={mockOnPickImage} />,
    );
    expect(screen.getByText("Change Photo")).toBeOnTheScreen();
  });

  it("should render image when imageUri is provided", () => {
    renderWithProviders(
      <GroupImagePicker imageUri="https://example.com/image.jpg" onPickImage={mockOnPickImage} />,
    );
    const image = screen.getByTestId("group-image-picker-image");
    expect(image).toBeOnTheScreen();
    expect(image.props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("should call onPickImage when pressed", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    fireEvent.press(screen.getByTestId("group-image-picker-touchable"));
    expect(mockOnPickImage).toHaveBeenCalledTimes(1);
  });

  it("should show uploading state with ActivityIndicator", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} isUploading={true} />,
    );
    expect(screen.getByTestId("group-image-picker-activity-indicator")).toBeOnTheScreen();
  });

  it("should show uploading text when isUploading is true", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} isUploading={true} />,
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
      />,
    );
    expect(screen.getByText("Uploading 50%")).toBeOnTheScreen();
  });

  it("should disable touchable when isUploading is true", () => {
    renderWithProviders(
      <GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} isUploading={true} />,
    );
    const touchable = screen.getByTestId("group-image-picker-touchable");
    expect(touchable.props.accessibilityState?.disabled).toBe(true);
  });

  it("should render camera icon in badge", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    expect(screen.getByText("camera-outline")).toBeOnTheScreen();
  });

  it("should render with correct container styling", () => {
    renderWithProviders(<GroupImagePicker imageUri={null} onPickImage={mockOnPickImage} />);
    expect(screen.getByTestId("group-image-picker-container")).toBeOnTheScreen();
  });
});
