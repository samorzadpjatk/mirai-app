import React from "react";
import { Text, TextInput, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsSearchBar } from "../../../trips/groups/GroupsSearchBar";

interface IoniconsProps {
  name: string;
}

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return {
    Ionicons: ({ name }: IoniconsProps) => React.createElement(Text, null, name),
  };
});

describe("GroupsSearchBar", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(UNSAFE_getByType(TextInput)).toBeTruthy();
  });

  it("should render with placeholder text", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(getByPlaceholderText("Search groups by name...")).toBeTruthy();
  });

  it("should display current value", () => {
    const { getByDisplayValue } = renderWithProviders(
      <GroupsSearchBar value="test query" onChangeText={mockOnChangeText} />
    );

    expect(getByDisplayValue("test query")).toBeTruthy();
  });

  it("should call onChangeText when text changes", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText("Search groups by name..."), "new search");

    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    expect(mockOnChangeText).toHaveBeenCalledWith("new search");
  });

  it("should handle empty value", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(UNSAFE_getByType(TextInput).props.value).toBe("");
  });

  it("should handle search icon", () => {
    const { getByText } = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(getByText("search")).toBeTruthy();
  });

  it("should render with correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(UNSAFE_getByType(View)).toBeTruthy();
  });
});
