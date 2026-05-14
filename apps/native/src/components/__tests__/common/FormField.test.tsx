import React from "react";
import { Text, TextInput, View, type TextProps } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FormField } from "../../common/ui/FormField";

describe("FormField", () => {
  it("should render with label", () => {
    renderWithProviders(
      <FormField label="Email">
        <TextInput testID="email-input" />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-label")).toHaveTextContent("Email");
  });

  it("should render children", () => {
    renderWithProviders(
      <FormField label="Name">
        <TextInput testID="name-input" placeholder="Enter name" />
      </FormField>,
    );

    expect(screen.getByTestId("name-input")).toBeOnTheScreen();
  });

  it("should show required indicator when required is true", () => {
    renderWithProviders(
      <FormField label="Username" required={true}>
        <TextInput />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-label")).toHaveTextContent("Username *");
    expect(screen.getByTestId("form-field-required")).toBeOnTheScreen();
  });

  it("should not show required indicator when required is false", () => {
    renderWithProviders(
      <FormField label="Optional Field" required={false}>
        <TextInput />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-label")).toHaveTextContent("Optional Field");
    expect(screen.queryByTestId("form-field-required")).toBeNull();
  });

  it("should not show required indicator by default", () => {
    renderWithProviders(
      <FormField label="Default Field">
        <TextInput />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-label")).toHaveTextContent("Default Field");
    expect(screen.queryByTestId("form-field-required")).toBeNull();
  });

  it("should render hint text when provided", () => {
    renderWithProviders(
      <FormField label="Password" hint="Must be at least 8 characters">
        <TextInput />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-hint")).toHaveTextContent(
      "Must be at least 8 characters",
    );
    expect(screen.getByText("Must be at least 8 characters")).toBeOnTheScreen();
  });

  it("should not render hint when not provided", () => {
    renderWithProviders(
      <FormField label="Field">
        <TextInput />
      </FormField>,
    );

    expect(screen.queryByTestId("form-field-hint")).toBeNull();
  });

  it("should render error text when provided", () => {
    renderWithProviders(
      <FormField label="Email" error="Invalid email format">
        <TextInput />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-error")).toHaveTextContent("Invalid email format");
    expect(screen.getByText("Invalid email format")).toBeOnTheScreen();
  });

  it("should not render error when not provided", () => {
    renderWithProviders(
      <FormField label="Field">
        <TextInput />
      </FormField>,
    );

    expect(screen.queryByTestId("form-field-error")).toBeNull();
  });

  it("should render both hint and error when both provided", () => {
    renderWithProviders(
      <FormField label="Field" hint="This is a hint" error="This is an error">
        <TextInput />
      </FormField>,
    );

    expect(screen.getByTestId("form-field-hint")).toHaveTextContent("This is a hint");
    expect(screen.getByTestId("form-field-error")).toHaveTextContent("This is an error");
    expect(screen.getByText("This is a hint")).toBeOnTheScreen();
    expect(screen.getByText("This is an error")).toBeOnTheScreen();
  });

  it("should apply custom style", () => {
    const customStyle = { marginBottom: 30 };
    renderWithProviders(
      <FormField label="Styled" style={customStyle}>
        <TextInput />
      </FormField>,
    );

    const container = screen.getByTestId("form-field-container");
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)]),
    );
  });

  it("should render complex children", () => {
    renderWithProviders(
      <FormField label="Complex Field" hint="Select an option">
        <Text testID="child-text">Child Component</Text>
      </FormField>,
    );

    expect(screen.getByTestId("form-field-label")).toHaveTextContent("Complex Field");
    expect(screen.getByTestId("form-field-hint")).toHaveTextContent("Select an option");
    expect(screen.getByText("Child Component")).toBeOnTheScreen();
  });

  it("should render multiple FormFields independently", () => {
    renderWithProviders(
      <>
        <FormField label="First Name" required={true}>
          <TextInput testID="first-name" />
        </FormField>
        <FormField label="Last Name" required={true}>
          <TextInput testID="last-name" />
        </FormField>
        <FormField label="Bio" hint="Optional">
          <TextInput testID="bio" />
        </FormField>
      </>,
    );

    // Get all labels by testID and verify their content
    const labels = screen.getAllByTestId("form-field-label");
    expect(labels).toHaveLength(3);
    expect(labels[0]).toHaveTextContent("First Name *");
    expect(labels[1]).toHaveTextContent("Last Name *");
    expect(labels[2]).toHaveTextContent("Bio");

    // Verify required indicators for first two fields
    const requiredIndicators = screen.getAllByTestId("form-field-required");
    expect(requiredIndicators).toHaveLength(2);

    // Verify hint is rendered
    expect(screen.getByTestId("form-field-hint")).toHaveTextContent("Optional");
    expect(screen.getByText("Optional")).toBeOnTheScreen();
  });
});
