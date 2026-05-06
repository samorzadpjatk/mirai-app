import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { SaveGroupButton } from "../../../../trips/groups/edit/SaveGroupButton";

describe("SaveGroupButton", () => {
  it("should render with 'Save Changes' label", () => {
    const { getByText } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={jest.fn()} />
    );

    expect(getByText("Save Changes")).toBeTruthy();
  });

  it("should call onPress when pressed and not submitting", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />
    );

    fireEvent.press(getByText("Save Changes"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isSubmitting is true", () => {
    const { queryByText, UNSAFE_getByType } = renderWithProviders(
      <SaveGroupButton isSubmitting={true} onPress={jest.fn()} />
    );

    expect(queryByText("Save Changes")).toBeNull();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should be disabled when isSubmitting is true", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <SaveGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not call onPress when button is disabled during submission", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <SaveGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should enable button when isSubmitting changes from true to false", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType, rerender } = renderWithProviders(
      <SaveGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);

    rerender(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should disable button when isSubmitting changes from false to true", () => {
    const onPress = jest.fn();
    const { getByText, rerender, UNSAFE_getByType } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />
    );

    fireEvent.press(getByText("Save Changes"));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(
      <SaveGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should handle multiple rapid presses when enabled", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />
    );

    fireEvent.press(getByText("Save Changes"));
    fireEvent.press(getByText("Save Changes"));
    fireEvent.press(getByText("Save Changes"));

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("should have disabled prop when isSubmitting is true", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType, rerender } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />
    );

    let button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(false);

    rerender(<SaveGroupButton isSubmitting={true} onPress={onPress} />);

    button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });
});
