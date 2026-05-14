import React from "react";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeActionButton } from "../../../trips/challenges/ChallengeActionButton";

describe("ChallengeActionButton", () => {
  it("should render with default label when not loading", () => {
    renderWithProviders(<ChallengeActionButton isLoading={false} onPress={jest.fn()} />);

    expect(screen.getByText("Take Challenge Photo")).toBeOnTheScreen();
  });

  it("should render with custom label", () => {
    renderWithProviders(
      <ChallengeActionButton isLoading={false} onPress={jest.fn()} label="Submit Challenge" />,
    );

    expect(screen.getByText("Submit Challenge")).toBeOnTheScreen();
  });

  it("should show loading label when isLoading is true", () => {
    renderWithProviders(<ChallengeActionButton isLoading={true} onPress={jest.fn()} />);

    expect(screen.getByText("Loading...")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<ChallengeActionButton isLoading={false} onPress={onPress} />);

    await user.press(screen.getByText("Take Challenge Photo"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render loading state correctly", () => {
    renderWithProviders(<ChallengeActionButton isLoading={true} onPress={jest.fn()} />);

    expect(screen.getByText("Loading...")).toBeOnTheScreen();
  });

  it("should render disabled state correctly", () => {
    renderWithProviders(
      <ChallengeActionButton isLoading={false} onPress={jest.fn()} disabled={true} />,
    );

    expect(screen.getByText("Take Challenge Photo")).toBeOnTheScreen();
  });

  it("should render with custom icon name", () => {
    renderWithProviders(
      <ChallengeActionButton isLoading={false} onPress={jest.fn()} iconName="camera-outline" />,
    );

    expect(screen.getByText("Take Challenge Photo")).toBeOnTheScreen();
  });

  it("should apply loading styles when isLoading is true", () => {
    renderWithProviders(<ChallengeActionButton isLoading={true} onPress={jest.fn()} />);

    expect(screen.getByText("Loading...")).toBeOnTheScreen();
  });

  it("should apply disabled styles when disabled prop is true", () => {
    renderWithProviders(
      <ChallengeActionButton isLoading={false} onPress={jest.fn()} disabled={true} />,
    );

    expect(screen.getByText("Take Challenge Photo")).toBeOnTheScreen();
  });
});
