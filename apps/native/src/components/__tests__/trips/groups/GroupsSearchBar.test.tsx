import React from "react";
import { Text, View } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
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
    renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(screen.getByPlaceholderText("Search groups by name...")).toBeTruthy();
  });

  it("should render with placeholder text", () => {
    renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(screen.getByPlaceholderText("Search groups by name...")).toBeTruthy();
  });

  it("should display current value", () => {
    renderWithProviders(
      <GroupsSearchBar value="test query" onChangeText={mockOnChangeText} />
    );

    expect(screen.getByDisplayValue("test query")).toBeTruthy();
  });

  it("should call onChangeText when text changes", () => {
    renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    fireEvent.changeText(screen.getByPlaceholderText("Search groups by name..."), "new search");

    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    expect(mockOnChangeText).toHaveBeenCalledWith("new search");
  });

  it("should handle empty value", () => {
    renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    const input = screen.getByPlaceholderText("Search groups by name...");
    interface InputElement { props: { value: string } }
    expect((input as unknown as InputElement).props.value).toBe("");
  });

  it("should handle search icon", () => {
    renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(screen.getByText("search")).toBeTruthy();
  });

  it("should render with correct container styling", () => {
    const view = renderWithProviders(
      <GroupsSearchBar value="" onChangeText={mockOnChangeText} />
    );

    expect(view.UNSAFE_getByType(View)).toBeTruthy();
  });
});
