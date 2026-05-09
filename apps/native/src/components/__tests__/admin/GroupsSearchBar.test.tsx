import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { GroupsSearchBar } from "../../admin/groups/GroupsSearchBar";

describe("GroupsSearchBar", () => {
  const mockOnSearchChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <GroupsSearchBar searchTerm="" onSearchChange={mockOnSearchChange} />
    );

    expect(getByPlaceholderText("Search groups...")).toBeTruthy();
  });

  it("displays current search term", () => {
    const { getByDisplayValue } = renderWithProviders(
      <GroupsSearchBar searchTerm="test query" onSearchChange={mockOnSearchChange} />
    );

    expect(getByDisplayValue("test query")).toBeTruthy();
  });

  it("calls onSearchChange when text changes", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <GroupsSearchBar searchTerm="" onSearchChange={mockOnSearchChange} />
    );

    const input = getByPlaceholderText("Search groups...");
    fireEvent.changeText(input, "new search");
    expect(mockOnSearchChange).toHaveBeenCalledWith("new search");
  });

  it("handles empty search term", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <GroupsSearchBar searchTerm="" onSearchChange={mockOnSearchChange} />
    );

    expect(getByPlaceholderText("Search groups...")).toBeTruthy();
  });

  it("handles long search terms", () => {
    const longSearchTerm = "a very long search term with many words";
    const { getByDisplayValue } = renderWithProviders(
      <GroupsSearchBar searchTerm={longSearchTerm} onSearchChange={mockOnSearchChange} />
    );

    expect(getByDisplayValue(longSearchTerm)).toBeTruthy();
  });

  it("handles special characters in search", () => {
    const specialSearch = "test@#$%^&*()";
    const { getByDisplayValue } = renderWithProviders(
      <GroupsSearchBar searchTerm={specialSearch} onSearchChange={mockOnSearchChange} />
    );

    expect(getByDisplayValue(specialSearch)).toBeTruthy();
  });
});
