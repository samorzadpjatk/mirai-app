import React from "react";
import { Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
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
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    expect(screen.getByPlaceholderText("Search by first name...")).toBeTruthy();
  });

  it("renders with custom placeholder", () => {
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="email"
        onFieldChange={jest.fn()}
        fields={mockFields}
        placeholder="Custom placeholder"
      />,
    );

    expect(screen.getByPlaceholderText("Custom placeholder")).toBeTruthy();
  });

  it("displays current search term", () => {
    renderWithProviders(
      <AdminSearchBar
        searchTerm="John"
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    expect(screen.getByDisplayValue("John")).toBeTruthy();
  });

  it("calls onSearchChange when text changes", () => {
    const onSearchChange = jest.fn();
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={onSearchChange}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    const input = screen.getByPlaceholderText("Search by first name...");
    fireEvent.changeText(input, "Jane");
    expect(onSearchChange).toHaveBeenCalledWith("Jane");
  });

  it("renders all field options", () => {
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    expect(screen.getByText("First Name")).toBeTruthy();
    expect(screen.getByText("Last Name")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("calls onFieldChange when field option is pressed", () => {
    const onFieldChange = jest.fn();
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={onFieldChange}
        fields={mockFields}
      />,
    );

    fireEvent.press(screen.getByText("Last Name"));
    expect(onFieldChange).toHaveBeenCalledWith("lastName");
  });

  it("updates placeholder when selected field changes", () => {
    const { rerender } = renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    expect(screen.getByPlaceholderText("Search by first name...")).toBeTruthy();

    rerender(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="email"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    expect(screen.getByPlaceholderText("Search by email...")).toBeTruthy();
  });

  it("handles empty fields array", () => {
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={[]}
      />,
    );

    expect(screen.getByPlaceholderText("Search by items...")).toBeTruthy();
  });

  it("renders search icon", () => {
    renderWithProviders(
      <AdminSearchBar
        searchTerm=""
        onSearchChange={jest.fn()}
        selectedField="firstName"
        onFieldChange={jest.fn()}
        fields={mockFields}
      />,
    );

    expect(screen.getByText("search")).toBeTruthy();
  });
});
