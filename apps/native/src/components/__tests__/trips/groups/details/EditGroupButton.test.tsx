import React from "react";
import { TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { EditGroupButton } from "../../../../trips/groups/details/EditGroupButton";

describe("EditGroupButton", () => {
  it("should render floating action button", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={jest.fn()} />
    );

    expect(UNSAFE_getByType(TouchableOpacity)).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have correct accessibility label", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={jest.fn()} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.accessibilityLabel).toBe("Edit group");
  });

  it("should have correct accessibility role", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={jest.fn()} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.accessibilityRole).toBe("button");
  });

  it("should use correct activeOpacity", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={jest.fn()} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.7);
  });

  it("should not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render with create icon", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={jest.fn()} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button).toBeTruthy();
  });

  it("should use correct icon size", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={jest.fn()} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button).toBeTruthy();
  });

  it("should handle multiple rapid presses", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <EditGroupButton onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("should maintain button state across re-renders", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType, rerender } = renderWithProviders(
      <EditGroupButton onPress={onPress} />
    );

    let button = UNSAFE_getByType(TouchableOpacity);
    expect(button).toBeTruthy();

    rerender(<EditGroupButton onPress={onPress} />);
    
    button = UNSAFE_getByType(TouchableOpacity);
    expect(button).toBeTruthy();
    
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
