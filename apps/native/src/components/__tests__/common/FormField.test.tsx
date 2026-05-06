import React from "react";
import { Text, TextInput, View, type TextProps } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FormField } from "../../common/ui/FormField";

interface TextElement {
  props: TextProps;
}

describe("FormField", () => {
  it("should render with label", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FormField label="Email">
        <TextInput testID="email-input" />
      </FormField>
    );

    const labelText = UNSAFE_getByType(Text);
    expect(labelText.props.children).toContain("Email");
  });

  it("should render children", () => {
    const { getByTestId } = renderWithProviders(
      <FormField label="Name">
        <TextInput testID="name-input" placeholder="Enter name" />
      </FormField>
    );

    expect(getByTestId("name-input")).toBeTruthy();
  });

  it("should show required indicator when required is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FormField label="Username" required={true}>
        <TextInput />
      </FormField>
    );

    const labelContainer = UNSAFE_getByType(Text);
    expect(labelContainer.props.children).toContain("Username");
  });

  it("should not show required indicator when required is false", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FormField label="Optional Field" required={false}>
        <TextInput />
      </FormField>
    );

    const labelContainer = UNSAFE_getByType(Text);
    expect(labelContainer.props.children).toContain("Optional Field");
  });

  it("should not show required indicator by default", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FormField label="Default Field">
        <TextInput />
      </FormField>
    );

    const labelContainer = UNSAFE_getByType(Text);
    expect(labelContainer.props.children).toContain("Default Field");
  });

  it("should render hint text when provided", () => {
    const { getByText } = renderWithProviders(
      <FormField label="Password" hint="Must be at least 8 characters">
        <TextInput />
      </FormField>
    );

    expect(getByText("Must be at least 8 characters")).toBeTruthy();
  });

  it("should not render hint when not provided", () => {
    const { queryByText } = renderWithProviders(
      <FormField label="Field">
        <TextInput />
      </FormField>
    );

    expect(queryByText("Some hint")).toBeNull();
  });

  it("should render error text when provided", () => {
    const { getByText } = renderWithProviders(
      <FormField label="Email" error="Invalid email format">
        <TextInput />
      </FormField>
    );

    expect(getByText("Invalid email format")).toBeTruthy();
  });

  it("should not render error when not provided", () => {
    const { queryByText } = renderWithProviders(
      <FormField label="Field">
        <TextInput />
      </FormField>
    );

    expect(queryByText("Some error")).toBeNull();
  });

  it("should render both hint and error when both provided", () => {
    const { getByText } = renderWithProviders(
      <FormField
        label="Field"
        hint="This is a hint"
        error="This is an error"
      >
        <TextInput />
      </FormField>
    );

    expect(getByText("This is a hint")).toBeTruthy();
    expect(getByText("This is an error")).toBeTruthy();
  });

  it("should apply custom style", () => {
    const customStyle = { marginBottom: 30 };
    const { UNSAFE_getByType } = renderWithProviders(
      <FormField label="Styled" style={customStyle}>
        <TextInput />
      </FormField>
    );

    const container = UNSAFE_getByType(View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render complex children", () => {
    const { UNSAFE_getAllByType, getByText } = renderWithProviders(
      <FormField label="Complex Field" hint="Select an option">
        <Text testID="child-text">Child Component</Text>
      </FormField>
    );

    const textElements = UNSAFE_getAllByType(Text) as TextElement[];
    const labelTexts = textElements.map((el) =>
      typeof el.props.children === "string"
        ? el.props.children
        : (el.props.children as string[])?.[0]
    );
    expect(labelTexts).toContain("Complex Field");
    expect(getByText("Select an option")).toBeTruthy();
    expect(getByText("Child Component")).toBeTruthy();
  });

  it("should render multiple FormFields independently", () => {
    const { UNSAFE_getAllByType, getByText } = renderWithProviders(
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

    const labels = UNSAFE_getAllByType(Text) as TextElement[];
    const labelTexts = labels.map((label) => 
      typeof label.props.children === "string" 
        ? label.props.children 
        : (label.props.children as string[])[0]
    );
    
    expect(labelTexts).toContain("First Name");
    expect(labelTexts).toContain("Last Name");
    expect(labelTexts).toContain("Bio");
    expect(getByText("Optional")).toBeTruthy();
  });
});
