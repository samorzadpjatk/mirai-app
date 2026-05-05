import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { PrimaryAddButton } from "../../common/buttons/PrimaryAddButton";

describe("PrimaryAddButton", () => {
  it("should render with default label", () => {
    const { getByText } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} />
    );

    expect(getByText("Add New")).toBeTruthy();
  });

  it("should render with custom label", () => {
    const { getByText } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} label="Create Item" />
    );

    expect(getByText("Create Item")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <PrimaryAddButton onPress={onPress} label="Add" />
    );

    fireEvent.press(getByText("Add"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have disabled prop when disabled is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} label="Disabled" disabled={true} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not have disabled prop when disabled is false", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} label="Enabled" disabled={false} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { marginTop: 20 };
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} label="Styled" style={customStyle} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 18 };
    const { getByText } = renderWithProviders(
      <PrimaryAddButton
        onPress={() => {}}
        label="Styled Text"
        textStyle={customTextStyle}
      />
    );

    const text = getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)])
    );
  });

  it("should use custom activeOpacity", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryAddButton
        onPress={() => {}}
        label="Opacity"
        activeOpacity={0.5}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.5);
  });

  it("should use default activeOpacity when not specified", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} label="Default" />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.9);
  });

  it("should render with add-circle icon", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <PrimaryAddButton onPress={() => {}} label="Add" />
    );

    const icons = UNSAFE_getAllByType(Text);
    expect(icons.length).toBeGreaterThan(0);
  });
});
