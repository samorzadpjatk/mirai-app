import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminSearchBar } from "../../admin/AdminSearchBar";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

describe("AdminSearchBar", () => {
  const mockFields = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
  ];

  it("renders search input with placeholder", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    expect(getByPlaceholderText("Search by first name...")).toBeTruthy();
  });

  it("renders with custom placeholder", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="email"
        onFieldChange={jest.fn()}
        fields={mockFields}
        placeholder="Custom placeholder"
      />
    );

    expect(getByPlaceholderText("Custom placeholder")).toBeTruthy();
  });

  it("displays current search term", () => {
    const { getByDisplayValue } = renderWithProviders(
      <AdminSearchBar
        searchTerm="John"
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    expect(getByDisplayValue("John")).toBeTruthy();
  });

  it("calls onSearchChange when text changes", () => {
    const onSearchChange = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={onSearchChange}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    const input = getByPlaceholderText("Search by first name...");
    fireEvent.changeText(input, "Jane");
    expect(onSearchChange).toHaveBeenCalledWith("Jane");
  });

  it("renders all field options", () => {
    const { getByText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    expect(getByText("First Name")).toBeTruthy();
    expect(getByText("Last Name")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
  });

  it("calls onFieldChange when field option is pressed", () => {
    const onFieldChange = jest.fn();
    const { getByText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={onFieldChange}
        fields={mockFields}
      />
    );

    fireEvent.press(getByText("Last Name"));
    expect(onFieldChange).toHaveBeenCalledWith("lastName");
  });

  it("updates placeholder when selected field changes", () => {
    const { getByPlaceholderText, rerender } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    expect(getByPlaceholderText("Search by first name...")).toBeTruthy();

    rerender(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="email"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    expect(getByPlaceholderText("Search by email...")).toBeTruthy();
  });

  it("handles empty fields array", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={[]}
      />
    );

    expect(getByPlaceholderText("Search by items...")).toBeTruthy();
  });

  it("renders search icon", () => {
    const { getByText } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />
    );

    expect(getByText("search")).toBeTruthy();
  });
});
