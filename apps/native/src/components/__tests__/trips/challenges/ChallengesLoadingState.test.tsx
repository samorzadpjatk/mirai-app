import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengesLoadingState } from "../../../trips/challenges/ChallengesLoadingState";

describe("ChallengesLoadingState", () => {
  it("should render container", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengesLoadingState />);
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengesLoadingState />);
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengesLoadingState />);
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have flex container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengesLoadingState />);
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view.props.style).toBeTruthy();
  });
});
