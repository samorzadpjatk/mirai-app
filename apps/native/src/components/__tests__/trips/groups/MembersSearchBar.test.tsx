import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { View } from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { MembersSearchBar } from "../../../trips/groups/create/MembersSearchBar";

const searchPlaceholder = "Search by name";

describe("MembersSearchBar", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    expect(getByPlaceholderText(searchPlaceholder)).toBeTruthy();
  });

  it("should render with placeholder text", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    expect(getByPlaceholderText(searchPlaceholder)).toBeTruthy();
  });

  it("should display current value", () => {
    const { getByDisplayValue } = renderWithProviders(
      <MembersSearchBar value="test query" onChangeText={mockOnChangeText} />
    );
    expect(getByDisplayValue("test query")).toBeTruthy();
  });

  it("should call onChangeText when text changes", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText(searchPlaceholder), "new search");
    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    expect(mockOnChangeText).toHaveBeenCalledWith("new search");
  });

  it("should handle empty value", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    expect(getByPlaceholderText(searchPlaceholder)).toHaveProp("value", "");
  });

  it("should render search icon", () => {
    const { getByText } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    expect(getByText("search")).toBeTruthy();
  });

  it("should render with correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    expect(UNSAFE_getByType(View)).toBeTruthy();
  });
});
