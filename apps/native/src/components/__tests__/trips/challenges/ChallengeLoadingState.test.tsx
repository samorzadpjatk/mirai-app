import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeLoadingState } from "../../../trips/challenges/ChallengeLoadingState";

describe("ChallengeLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.getByTestId("challenge-loading-container");
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const activityIndicator = screen.getByTestId("challenge-loading-indicator");
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const activityIndicator = screen.getByTestId("challenge-loading-indicator");
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.getByTestId("challenge-loading-container");
    expect(view.props.style).toBeTruthy();
  });
});
