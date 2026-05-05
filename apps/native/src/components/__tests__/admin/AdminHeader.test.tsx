import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminHeader } from "../../admin/AdminHeader";

describe("AdminHeader", () => {
  it("renders with title only", () => {
    const { getByText } = renderWithProviders(
      <AdminHeader title="Test Title" />
    );

    expect(getByText("Test Title")).toBeTruthy();
  });

  it("renders with title and subtitle", () => {
    const { getByText } = renderWithProviders(
      <AdminHeader title="Test Title" subtitle="Test Subtitle" />
    );

    expect(getByText("Test Title")).toBeTruthy();
    expect(getByText("Test Subtitle")).toBeTruthy();
  });

  it("renders back button when showBackButton is true", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <AdminHeader title="Test Title" showBackButton />
    );

    expect(UNSAFE_getAllByType(TouchableOpacity)).toHaveLength(1);
  });

  it("does not render back button when showBackButton is false", () => {
    const { UNSAFE_queryAllByType } = renderWithProviders(
      <AdminHeader title="Test Title" showBackButton={false} />
    );

    expect(UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
  });

  it("calls onBackPress when back button is pressed", () => {
    const onBackPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <AdminHeader title="Test Title" showBackButton onBackPress={onBackPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onBackPress).toHaveBeenCalled();
  });

  it("renders right component when provided", () => {
    const { getByText } = renderWithProviders(
      <AdminHeader
        title="Test Title"
        rightComponent={<Text>Right Content</Text>}
      />
    );

    expect(getByText("Right Content")).toBeTruthy();
  });

  it("renders without right component when not provided", () => {
    const { getByText, queryByText } = renderWithProviders(
      <AdminHeader title="Test Title" />
    );

    expect(getByText("Test Title")).toBeTruthy();
    expect(queryByText("Right Content")).toBeNull();
  });

  it("handles long titles gracefully", () => {
    const longTitle = "This is a very long title that might overflow";
    const { getByText } = renderWithProviders(
      <AdminHeader title={longTitle} />
    );

    expect(getByText(longTitle)).toBeTruthy();
  });

  it("handles empty subtitle gracefully", () => {
    const { getByText, queryByText } = renderWithProviders(
      <AdminHeader title="Test Title" subtitle="" />
    );

    expect(getByText("Test Title")).toBeTruthy();
    expect(queryByText("Some Subtitle")).toBeNull();
  });
});
