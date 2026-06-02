import { Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminHeader } from "../../admin/AdminHeader";

describe("AdminHeader", () => {
  it("renders with title only", () => {
    renderWithProviders(<AdminHeader title="Test Title" />);

    expect(screen.getByText("Test Title")).toBeTruthy();
  });

  it("renders with title and subtitle", () => {
    renderWithProviders(<AdminHeader title="Test Title" subtitle="Test Subtitle" />);

    expect(screen.getByText("Test Title")).toBeTruthy();
    expect(screen.getByText("Test Subtitle")).toBeTruthy();
  });

  it("renders back button when showBackButton is true", () => {
    renderWithProviders(<AdminHeader title="Test Title" showBackButton />);

    expect(screen.getAllByTestId("back-button")).toHaveLength(1);
  });

  it("does not render back button when showBackButton is false", () => {
    renderWithProviders(<AdminHeader title="Test Title" showBackButton={false} />);

    expect(screen.queryAllByTestId("back-button")).toHaveLength(0);
  });

  it("calls onBackPress when back button is pressed", () => {
    const onBackPress = jest.fn();
    renderWithProviders(
      <AdminHeader title="Test Title" showBackButton onBackPress={onBackPress} />,
    );

    fireEvent.press(screen.getByTestId("back-button"));
    expect(onBackPress).toHaveBeenCalled();
  });

  it("renders right component when provided", () => {
    renderWithProviders(
      <AdminHeader title="Test Title" rightComponent={<Text>Right Content</Text>} />,
    );

    expect(screen.getByText("Right Content")).toBeTruthy();
  });

  it("renders without right component when not provided", () => {
    renderWithProviders(<AdminHeader title="Test Title" />);

    expect(screen.getByText("Test Title")).toBeTruthy();
    expect(screen.queryByText("Right Content")).toBeNull();
  });

  it("handles long titles gracefully", () => {
    const longTitle = "This is a very long title that might overflow";
    renderWithProviders(<AdminHeader title={longTitle} />);

    expect(screen.getByText(longTitle)).toBeTruthy();
  });

  it("handles empty subtitle gracefully", () => {
    renderWithProviders(<AdminHeader title="Test Title" subtitle="" />);

    expect(screen.getByText("Test Title")).toBeTruthy();
    expect(screen.queryByText("Some Subtitle")).toBeNull();
  });
});
