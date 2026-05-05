import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { PrimaryLoadingButton } from "../../common/buttons/PrimaryLoadingButton";

describe("PrimaryLoadingButton", () => {
  it("should render with label", () => {
    const { getByText } = renderWithProviders(
      <PrimaryLoadingButton
        label="Click Me"
        isLoading={false}
        onPress={() => {}}
      />
    );

    expect(getByText("Click Me")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <PrimaryLoadingButton
        label="Click"
        isLoading={false}
        onPress={onPress}
      />
    );

    fireEvent.press(getByText("Click"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isLoading is true", () => {
    const { queryByText, UNSAFE_getByType } = renderWithProviders(
      <PrimaryLoadingButton
        label="Loading"
        isLoading={true}
        onPress={() => {}}
      />
    );

    expect(queryByText("Loading")).toBeNull();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should have disabled prop when isLoading is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryLoadingButton
        label="Loading"
        isLoading={true}
        onPress={() => {}}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should have disabled prop when disabled prop is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryLoadingButton
        label="Disabled"
        isLoading={false}
        onPress={() => {}}
        disabled={true}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not have disabled prop when not loading or disabled", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryLoadingButton
        label="Enabled"
        isLoading={false}
        onPress={() => {}}
        disabled={false}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { backgroundColor: "red" };
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryLoadingButton
        label="Styled"
        isLoading={false}
        onPress={() => {}}
        style={customStyle}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 20 };
    const { getByText } = renderWithProviders(
      <PrimaryLoadingButton
        label="Styled Text"
        isLoading={false}
        onPress={() => {}}
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
      <PrimaryLoadingButton
        label="Opacity"
        isLoading={false}
        onPress={() => {}}
        activeOpacity={0.5}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.5);
  });

  it("should use default activeOpacity when not specified", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <PrimaryLoadingButton
        label="Default Opacity"
        isLoading={false}
        onPress={() => {}}
      />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.9);
  });
});
