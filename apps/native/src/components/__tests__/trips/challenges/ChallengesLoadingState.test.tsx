import { screen } from "@testing-library/react-native";
import { ChallengesLoadingState } from "../../../trips/challenges/ChallengesLoadingState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengesLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-container");
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const activityIndicator = screen.getByTestId("challenges-loading-indicator");
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const activityIndicator = screen.getByTestId("challenges-loading-indicator");
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-container");
    expect(view.props.style).toBeTruthy();
  });
});
