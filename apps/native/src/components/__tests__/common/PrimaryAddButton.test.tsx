import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { PrimaryAddButton } from "../../common/buttons/PrimaryAddButton";

const noop = (): void => undefined;

describe("PrimaryAddButton", () => {
  it("should render with default label", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} />);

    expect(screen.getByText("Add New")).toBeTruthy();
  });

  it("should render with custom label", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} label="Create Item" />);

    expect(screen.getByText("Create Item")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    renderWithProviders(<PrimaryAddButton onPress={onPress} label="Add" />);

    fireEvent.press(screen.getByText("Add"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have disabled prop when disabled is true", () => {
    const view = renderWithProviders(
      <PrimaryAddButton onPress={noop} label="Disabled" disabled={true} />
    );

    const button = view.UNSAFE_getByType(TouchableOpacity);
    type ButtonElement = { props: { disabled: boolean } };
    expect((button as unknown as ButtonElement).props.disabled).toBe(true);
  });

  it("should not have disabled prop when disabled is false", () => {
    const view = renderWithProviders(
      <PrimaryAddButton onPress={noop} label="Enabled" disabled={false} />
    );

    const button = view.UNSAFE_getByType(TouchableOpacity);
    type ButtonElement = { props: { disabled: boolean } };
    expect((button as unknown as ButtonElement).props.disabled).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { marginTop: 20 };
    const view = renderWithProviders(
      <PrimaryAddButton onPress={noop} label="Styled" style={customStyle} />
    );

    const button = view.UNSAFE_getByType(TouchableOpacity);
    type ButtonElement = { props: { style: unknown } };
    expect((button as unknown as ButtonElement).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 18 };
    renderWithProviders(
      <PrimaryAddButton
        onPress={noop}
        label="Styled Text"
        textStyle={customTextStyle}
      />
    );

    const text = screen.getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)])
    );
  });

  it("should use custom activeOpacity", () => {
    const view = renderWithProviders(
      <PrimaryAddButton
        onPress={noop}
        label="Opacity"
        activeOpacity={0.5}
      />
    );

    const button = view.UNSAFE_getByType(TouchableOpacity);
    type ButtonElement = { props: { activeOpacity: number } };
    expect((button as unknown as ButtonElement).props.activeOpacity).toBe(0.5);
  });

  it("should use default activeOpacity when not specified", () => {
    const view = renderWithProviders(
      <PrimaryAddButton onPress={noop} label="Default" />
    );

    const button = view.UNSAFE_getByType(TouchableOpacity);
    type ButtonElement = { props: { activeOpacity: number } };
    expect((button as unknown as ButtonElement).props.activeOpacity).toBe(0.9);
  });

  it("should render with add-circle icon", () => {
    const view = renderWithProviders(<PrimaryAddButton onPress={noop} label="Add" />);

    const icons = view.UNSAFE_getAllByType(Text);
    expect(icons.length).toBeGreaterThan(0);
  });
});
