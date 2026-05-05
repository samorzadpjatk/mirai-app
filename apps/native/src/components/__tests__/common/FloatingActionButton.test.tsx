import React from "react";
import { TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FloatingActionButton } from "../../common/FloatingActionButton";

describe("FloatingActionButton", () => {
  it("should render with icon", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add item"
      />
    );

    expect(UNSAFE_getByType(TouchableOpacity)).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={onPress}
        iconName="add"
        accessibilityLabel="Add"
      />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have disabled prop when disabled is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
        disabled={true}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not have disabled prop when disabled is false", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
        disabled={false}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { bottom: 100, right: 20 };
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
        style={customStyle}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render icon with custom size", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
        iconSize={48}
      />
    );

    expect(UNSAFE_getByType(TouchableOpacity)).toBeTruthy();
  });

  it("should render icon with default size", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
      />
    );

    expect(UNSAFE_getByType(TouchableOpacity)).toBeTruthy();
  });

  it("should use custom activeOpacity", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
        activeOpacity={0.5}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.5);
  });

  it("should use default activeOpacity when not specified", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add"
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.7);
  });

  it("should have correct accessibility role and label", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FloatingActionButton
        onPress={() => {}}
        iconName="add"
        accessibilityLabel="Add new item"
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityLabel).toBe("Add new item");
  });
});
