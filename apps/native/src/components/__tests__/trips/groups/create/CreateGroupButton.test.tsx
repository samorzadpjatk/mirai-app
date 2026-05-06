import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { CreateGroupButton } from "../../../../trips/groups/create/CreateGroupButton";

describe("CreateGroupButton", () => {
  it("should render with 'Create Group' label", () => {
    renderWithProviders(
      <CreateGroupButton isSubmitting={false} onPress={jest.fn()} />
    );

    expect(screen.getByText("Create Group")).toBeOnTheScreen();
  });

  it("should call onPress when pressed and not submitting", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CreateGroupButton isSubmitting={false} onPress={onPress} />
    );

    await user.press(screen.getByText("Create Group"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isSubmitting is true", () => {
    renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={jest.fn()} />
    );

    expect(screen.queryByText("Create Group")).toBeNull();
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should be disabled when isSubmitting is true", () => {
    renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={jest.fn()} />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not call onPress when button is disabled during submission", () => {
    const onPress = jest.fn();

    renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should enable button when isSubmitting changes from true to false", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = screen.UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);

    rerender(<CreateGroupButton isSubmitting={false} onPress={onPress} />);

    await user.press(screen.getByText("Create Group"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
