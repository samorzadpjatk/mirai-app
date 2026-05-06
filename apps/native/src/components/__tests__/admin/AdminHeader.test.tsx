import React from "react";
import { Text, TouchableOpacity } from "react-native";
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
    const view = renderWithProviders(<AdminHeader title="Test Title" showBackButton />);

    expect(view.UNSAFE_getAllByType(TouchableOpacity)).toHaveLength(1);
  });

  it("does not render back button when showBackButton is false", () => {
    const view = renderWithProviders(<AdminHeader title="Test Title" showBackButton={false} />);

    expect(view.UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
  });

  it("calls onBackPress when back button is pressed", () => {
    const onBackPress = jest.fn();
    const view = renderWithProviders(
      <AdminHeader title="Test Title" showBackButton onBackPress={onBackPress} />
    );

    fireEvent.press(view.UNSAFE_getByType(TouchableOpacity));
    expect(onBackPress).toHaveBeenCalled();
  });

  it("renders right component when provided", () => {
    renderWithProviders(
      <AdminHeader
        title="Test Title"
        rightComponent={<Text>Right Content</Text>}
      />
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
