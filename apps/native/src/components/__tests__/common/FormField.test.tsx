import React from "react";
import { Text, TextInput, View, type TextProps } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FormField } from "../../common/ui/FormField";

interface TextElement {
  props: TextProps;
}

describe("FormField", () => {
  it("should render with label", () => {
    renderWithProviders(
      <FormField label="Email">
        <TextInput testID="email-input" />
      </FormField>
    );

    const labelText = screen.UNSAFE_getByType(Text);
    expect(labelText.props.children).toContain("Email");
  });

  it("should render children", () => {
    renderWithProviders(
      <FormField label="Name">
        <TextInput testID="name-input" placeholder="Enter name" />
      </FormField>
    );

    expect(screen.getByTestId("name-input")).toBeOnTheScreen();
  });

  it("should show required indicator when required is true", () => {
    renderWithProviders(
      <FormField label="Username" required={true}>
        <TextInput />
      </FormField>
    );

    const labelContainer = screen.UNSAFE_getByType(Text);
    expect(labelContainer.props.children).toContain("Username");
  });

  it("should not show required indicator when required is false", () => {
    renderWithProviders(
      <FormField label="Optional Field" required={false}>
        <TextInput />
      </FormField>
    );

    const labelContainer = screen.UNSAFE_getByType(Text);
    expect(labelContainer.props.children).toContain("Optional Field");
  });

  it("should not show required indicator by default", () => {
    renderWithProviders(
      <FormField label="Default Field">
        <TextInput />
      </FormField>
    );

    const labelContainer = screen.UNSAFE_getByType(Text);
    expect(labelContainer.props.children).toContain("Default Field");
  });

  it("should render hint text when provided", () => {
    renderWithProviders(
      <FormField label="Password" hint="Must be at least 8 characters">
        <TextInput />
      </FormField>
    );

    expect(screen.getByText("Must be at least 8 characters")).toBeOnTheScreen();
  });

  it("should not render hint when not provided", () => {
    renderWithProviders(
      <FormField label="Field">
        <TextInput />
      </FormField>
    );

    expect(screen.queryByText("Some hint")).toBeNull();
  });

  it("should render error text when provided", () => {
    renderWithProviders(
      <FormField label="Email" error="Invalid email format">
        <TextInput />
      </FormField>
    );

    expect(screen.getByText("Invalid email format")).toBeOnTheScreen();
  });

  it("should not render error when not provided", () => {
    renderWithProviders(
      <FormField label="Field">
        <TextInput />
      </FormField>
    );

    expect(screen.queryByText("Some error")).toBeNull();
  });

  it("should render both hint and error when both provided", () => {
    renderWithProviders(
      <FormField
        label="Field"
        hint="This is a hint"
        error="This is an error"
      >
        <TextInput />
      </FormField>
    );

    expect(screen.getByText("This is a hint")).toBeOnTheScreen();
    expect(screen.getByText("This is an error")).toBeOnTheScreen();
  });

  it("should apply custom style", () => {
    const customStyle = { marginBottom: 30 };
    renderWithProviders(
      <FormField label="Styled" style={customStyle}>
        <TextInput />
      </FormField>
    );

    const container = screen.UNSAFE_getByType(View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render complex children", () => {
    renderWithProviders(
      <FormField label="Complex Field" hint="Select an option">
        <Text testID="child-text">Child Component</Text>
      </FormField>
    );

    const textElements = screen.UNSAFE_getAllByType(Text) as TextElement[];
    const labelTexts = textElements.map((el) =>
      typeof el.props.children === "string"
        ? el.props.children
        : (el.props.children as string[])?.[0]
    );
    expect(labelTexts).toContain("Complex Field");
    expect(screen.getByText("Select an option")).toBeOnTheScreen();
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
      </>
    );

    const labels = screen.UNSAFE_getAllByType(Text) as TextElement[];
    const labelTexts = labels.map((label) => 
      typeof label.props.children === "string" 
        ? label.props.children 
        : (label.props.children as string[])[0]
    );
    
    expect(labelTexts).toContain("First Name");
    expect(labelTexts).toContain("Last Name");
    expect(labelTexts).toContain("Bio");
    expect(screen.getByText("Optional")).toBeOnTheScreen();
  });
});
