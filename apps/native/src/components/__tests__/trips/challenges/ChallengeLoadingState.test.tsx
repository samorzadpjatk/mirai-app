import React from "react";
import { ActivityIndicator, View } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeLoadingState } from "../../../trips/challenges/ChallengeLoadingState";

describe("ChallengeLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const activityIndicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const activityIndicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.UNSAFE_getByType(View);
    expect(view.props.style).toBeTruthy();
  });
});
