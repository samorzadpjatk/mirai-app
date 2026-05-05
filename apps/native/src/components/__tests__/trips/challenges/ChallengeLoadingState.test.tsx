import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeLoadingState } from "../../../trips/challenges/ChallengeLoadingState";

describe("ChallengeLoadingState", () => {
  it("should render container", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeLoadingState />);
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeLoadingState />);
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeLoadingState />);
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have flex container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeLoadingState />);
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view.props.style).toBeTruthy();
  });
});
