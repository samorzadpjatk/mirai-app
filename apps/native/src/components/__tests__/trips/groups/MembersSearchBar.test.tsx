import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { MembersSearchBar } from "../../../trips/groups/create/MembersSearchBar";

describe("MembersSearchBar", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    const textInput = UNSAFE_getByType(require("react-native").TextInput);
    expect(textInput).toBeTruthy();
  });

  it("should render with placeholder text", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    const textInput = UNSAFE_getByType(require("react-native").TextInput);
    expect(textInput.props.placeholder).toBe("Search by name");
  });

  it("should display current value", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersSearchBar value="test query" onChangeText={mockOnChangeText} />
    );
    const textInput = UNSAFE_getByType(require("react-native").TextInput);
    expect(textInput.props.value).toBe("test query");
  });

  it("should call onChangeText when text changes", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    const textInput = UNSAFE_getByType(require("react-native").TextInput);
    fireEvent.changeText(textInput, "new search");
    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    expect(mockOnChangeText).toHaveBeenCalledWith("new search");
  });

  it("should handle empty value", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <MembersSearchBar value="" onChangeText={mockOnChangeText} />
    );
    const textInput = UNSAFE_getByType(require("react-native").TextInput);
    expect(textInput.props.value).toBe("");
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
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });
});
