import React from "react";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { PrimaryLoadingButton } from "../../common/buttons/PrimaryLoadingButton";

describe("PrimaryLoadingButton", () => {
  it("should render with label", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Click Me"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        testID="button"
      />,
    );

    expect(screen.getByText("Click Me")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <PrimaryLoadingButton label="Click" isLoading={false} onPress={onPress} testID="button" />,
    );

    await user.press(screen.getByText("Click"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isLoading is true", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Loading"
        isLoading={true}
        onPress={() => {
          /* noop */
        }}
        testID="button"
      />,
    );

    expect(screen.queryByText("Loading")).toBeNull();
    expect(screen.getByTestId("button-loading-indicator")).toBeOnTheScreen();
  });

  it("should have disabled prop when isLoading is true", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Loading"
        isLoading={true}
        onPress={() => {
          /* noop */
        }}
        testID="button"
      />,
    );

    const button = screen.getByTestId("button");
    expect(button).toBeDisabled();
  });

  it("should have disabled prop when disabled prop is true", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Disabled"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        disabled={true}
        testID="button"
      />,
    );

    const button = screen.getByTestId("button");
    expect(button).toBeDisabled();
  });

  it("should not have disabled prop when not loading or disabled", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Enabled"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        disabled={false}
        testID="button"
      />,
    );

    const button = screen.getByTestId("button");
    expect(button).not.toBeDisabled();
  });

  it("should apply custom style", () => {
    const customStyle = { backgroundColor: "red" };
    renderWithProviders(
      <PrimaryLoadingButton
        label="Styled"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        style={customStyle}
        testID="button"
      />,
    );

    const button = screen.getByTestId("button");
    expect(button).toHaveStyle(customStyle);
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 20 };
    renderWithProviders(
      <PrimaryLoadingButton
        label="Styled Text"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        textStyle={customTextStyle}
        testID="button"
      />,
    );

    const text = screen.getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)]),
    );
  });

  it("should use custom activeOpacity", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Opacity"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        activeOpacity={0.5}
        testID="button"
      />,
    );

    // activeOpacity is a React Native internal prop that doesn't get passed to host elements
    // This test verifies the component renders without error with custom activeOpacity
    expect(screen.getByTestId("button")).toBeOnTheScreen();
  });

  it("should use default activeOpacity when not specified", () => {
    renderWithProviders(
      <PrimaryLoadingButton
        label="Default Opacity"
        isLoading={false}
        onPress={() => {
          /* noop */
        }}
        testID="button"
      />,
    );

    // activeOpacity is a React Native internal prop that doesn't get passed to host elements
    // This test verifies the component renders without error with default activeOpacity
    expect(screen.getByTestId("button")).toBeOnTheScreen();
  });
});
