import { screen } from "@testing-library/react-native";
import { ChallengeLoadingState } from "../../../trips/challenges/ChallengeLoadingState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengeLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.getByTestId("challenge-loading-state");
    expect(view).toBeTruthy();
  });

  it("should render placeholder views", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.getByTestId("challenge-loading-state");
    expect(view.children.length).toBeGreaterThan(0);
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengeLoadingState />);
    const view = screen.getByTestId("challenge-loading-state");
    expect(view.props.style).toBeTruthy();
  });
});
