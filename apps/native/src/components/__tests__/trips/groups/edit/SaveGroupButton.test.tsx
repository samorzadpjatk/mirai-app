import React from "react";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { SaveGroupButton } from "../../../../trips/groups/edit/SaveGroupButton";

describe("SaveGroupButton", () => {
  it("should render with 'Save Changes' label", () => {
    renderWithProviders(<SaveGroupButton isSubmitting={false} onPress={jest.fn()} />);

    expect(screen.getByText("Save Changes")).toBeOnTheScreen();
  });

  it("should call onPress when pressed and not submitting", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<SaveGroupButton isSubmitting={false} onPress={onPress} />);

    await user.press(screen.getByText("Save Changes"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isSubmitting is true", () => {
    renderWithProviders(<SaveGroupButton isSubmitting={true} onPress={jest.fn()} />);

    expect(screen.queryByText("Save Changes")).toBeNull();
    expect(screen.getByTestId("save-group-button-loading-indicator")).toBeTruthy();
  });

  it("should be disabled when isSubmitting is true", () => {
    const onPress = jest.fn();
    renderWithProviders(<SaveGroupButton isSubmitting={true} onPress={onPress} />);

    const button = screen.getByTestId("save-group-button");
    expect(button).toBeDisabled();
  });

  it("should have disabled prop when isSubmitting is true", () => {
    const onPress = jest.fn();

    renderWithProviders(<SaveGroupButton isSubmitting={true} onPress={onPress} />);

    const button = screen.getByTestId("save-group-button");
    expect(button).toBeDisabled();
  });

  it("should enable button when isSubmitting changes from true to false", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <SaveGroupButton isSubmitting={true} onPress={onPress} />,
    );

    const button = screen.getByTestId("save-group-button");
    expect(button).toBeDisabled();

    rerender(<SaveGroupButton isSubmitting={false} onPress={onPress} />);

    await user.press(screen.getByText("Save Changes"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should disable button when isSubmitting changes from false to true", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />,
    );

    await user.press(screen.getByText("Save Changes"));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(<SaveGroupButton isSubmitting={true} onPress={onPress} />);

    const button = screen.getByTestId("save-group-button");
    expect(button).toBeDisabled();
  });

  it("should handle multiple rapid presses when enabled", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<SaveGroupButton isSubmitting={false} onPress={onPress} />);

    await user.press(screen.getByText("Save Changes"));
    await user.press(screen.getByText("Save Changes"));
    await user.press(screen.getByText("Save Changes"));

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("should have disabled prop when isSubmitting is true", () => {
    const onPress = jest.fn();
    const { rerender } = renderWithProviders(
      <SaveGroupButton isSubmitting={false} onPress={onPress} />,
    );

    let button = screen.getByTestId("save-group-button");
    expect(button).toBeEnabled();

    rerender(<SaveGroupButton isSubmitting={true} onPress={onPress} />);

    button = screen.getByTestId("save-group-button");
    expect(button).toBeDisabled();
  });
});
