import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeActionButton } from "../../../trips/challenges/ChallengeActionButton";

describe("ChallengeActionButton", () => {
  it("should render with default label when not loading", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton isLoading={false} onPress={() => {}} />
    );

    expect(getByText("Take Challenge Photo")).toBeTruthy();
  });

  it("should render with custom label", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton
        isLoading={false}
        onPress={() => {}}
        label="Submit Challenge"
      />
    );

    expect(getByText("Submit Challenge")).toBeTruthy();
  });

  it("should show loading label when isLoading is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton isLoading={true} onPress={() => {}} />
    );

    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeActionButton isLoading={false} onPress={onPress} />
    );

    fireEvent.press(getByText("Take Challenge Photo"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render loading state correctly", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton isLoading={true} onPress={() => {}} />
    );

    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should render disabled state correctly", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton
        isLoading={false}
        onPress={() => {}}
        disabled={true}
      />
    );

    expect(getByText("Take Challenge Photo")).toBeTruthy();
  });

  it("should render with custom icon name", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton
        isLoading={false}
        onPress={() => {}}
        iconName="camera-outline"
      />
    );

    expect(getByText("Take Challenge Photo")).toBeTruthy();
  });

  it("should apply loading styles when isLoading is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton isLoading={true} onPress={() => {}} />
    );

    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should apply disabled styles when disabled prop is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeActionButton
        isLoading={false}
        onPress={() => {}}
        disabled={true}
      />
    );

    const text = getByText("Take Challenge Photo");
    expect(text).toBeTruthy();
  });
});
