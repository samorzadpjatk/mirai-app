import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import {
  fireEvent,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { PrimaryLoadingButton } from "../../common/buttons/PrimaryLoadingButton";

describe("PrimaryLoadingButton", () => {
  it("should render with label", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Click Me"
        isLoading={false}
        onPress={() => { /* noop */ }}
      />
    );

    expect(screen.getByText("Click Me")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <PrimaryLoadingButton
        label="Click"
        isLoading={false}
        onPress={onPress}
      />
    );

    await user.press(screen.getByText("Click"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isLoading is true", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Loading"
        isLoading={true}
        onPress={() => { /* noop */ }}
      />
    );

    expect(screen.queryByText("Loading")).toBeNull();
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should have disabled prop when isLoading is true", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Loading"
        isLoading={true}
        onPress={() => { /* noop */ }}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should have disabled prop when disabled prop is true", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Disabled"
        isLoading={false}
        onPress={() => { /* noop */ }}
        disabled={true}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not have disabled prop when not loading or disabled", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Enabled"
        isLoading={false}
        onPress={() => { /* noop */ }}
        disabled={false}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { backgroundColor: "red" };
    renderWithProviders(
      <PrimaryLoadingButton
        label="Styled"
        isLoading={false}
        onPress={() => { /* noop */ }}
        style={customStyle}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 20 };
    renderWithProviders(
      <PrimaryLoadingButton
        label="Styled Text"
        isLoading={false}
        onPress={() => { /* noop */ }}
        textStyle={customTextStyle}
      />
    );

    const text = screen.getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)])
    );
  });

  it("should use custom activeOpacity", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Opacity"
        isLoading={false}
        onPress={() => { /* noop */ }}
        activeOpacity={0.5}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.5);
  });

  it("should use default activeOpacity when not specified", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Default Opacity"
        isLoading={false}
        onPress={() => { /* noop */ }}
      />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.activeOpacity).toBe(0.9);
  });
});
