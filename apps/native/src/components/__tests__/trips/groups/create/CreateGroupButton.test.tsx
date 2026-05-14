import React from "react";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { CreateGroupButton } from "../../../../trips/groups/create/CreateGroupButton";

describe("CreateGroupButton", () => {
  it("should render with 'Create Group' label", () => {
    renderWithProviders(<CreateGroupButton isSubmitting={false} onPress={jest.fn()} />);

    expect(screen.getByText("Create Group")).toBeOnTheScreen();
  });

  it("should call onPress when pressed and not submitting", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<CreateGroupButton isSubmitting={false} onPress={onPress} />);

    await user.press(screen.getByText("Create Group"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isSubmitting is true", () => {
    renderWithProviders(<CreateGroupButton isSubmitting={true} onPress={jest.fn()} />);

    expect(screen.queryByText("Create Group")).toBeNull();
    expect(screen.getByTestId("create-group-button-loading-indicator")).toBeTruthy();
  });

  it("should be disabled when isSubmitting is true", () => {
    renderWithProviders(<CreateGroupButton isSubmitting={true} onPress={jest.fn()} />);

    const button = screen.getByTestId("create-group-button");
    expect(button).toBeDisabled();
  });

  it("should have disabled prop when isSubmitting is true", () => {
    const onPress = jest.fn();

    renderWithProviders(<CreateGroupButton isSubmitting={true} onPress={onPress} />);

    const button = screen.getByTestId("create-group-button");
    expect(button).toBeDisabled();
  });

  it("should enable button when isSubmitting changes from true to false", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={onPress} />,
    );

    const button = screen.getByTestId("create-group-button");
    expect(button).toBeDisabled();

    rerender(<CreateGroupButton isSubmitting={false} onPress={onPress} />);

    await user.press(screen.getByText("Create Group"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
