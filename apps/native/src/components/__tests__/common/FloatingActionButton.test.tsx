import React from "react";
import { TouchableOpacity } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FloatingActionButton } from "../../common/FloatingActionButton";

const noop = (): void => undefined;

describe("FloatingActionButton", () => {
  it("should render with icon", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add item"
      />
    );

    expect(screen.getByLabelText("Add item")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <FloatingActionButton
        onPress={onPress}
        iconName="add"
        accessibilityLabel="Add"
      />
    );

    await user.press(screen.getByLabelText("Add"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have disabled prop when disabled is true", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        disabled={true}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not have disabled prop when disabled is false", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        disabled={false}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { bottom: 100, right: 20 };
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        style={customStyle}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render icon with custom size", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        iconSize={48}
      />
    );

    expect(screen.getByLabelText("Add")).toBeOnTheScreen();
  });

  it("should render icon with default size", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
      />
    );

    expect(screen.getByLabelText("Add")).toBeOnTheScreen();
  });

  it("should use custom activeOpacity", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        activeOpacity={0.5}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.5);
  });

  it("should use default activeOpacity when not specified", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.7);
  });

  it("should have correct accessibility role and label", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add new item"
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityLabel).toBe("Add new item");
  });
});
