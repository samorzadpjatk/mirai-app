import React from "react";
import { ActivityIndicator, View } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengesLoadingState } from "../../../trips/challenges/ChallengesLoadingState";

describe("ChallengesLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const activityIndicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const activityIndicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.UNSAFE_getByType(View);
    expect(view.props.style).toBeTruthy();
  });
});
