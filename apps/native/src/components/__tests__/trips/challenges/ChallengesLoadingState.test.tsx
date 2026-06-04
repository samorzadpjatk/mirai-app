import { screen } from "@testing-library/react-native";
import { ChallengesLoadingState } from "../../../trips/challenges/ChallengesLoadingState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengesLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-state");
    expect(view).toBeTruthy();
  });

  it("should render placeholder views", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-state");
    expect(view.children.length).toBeGreaterThan(0);
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-state");
    expect(view.props.style).toBeTruthy();
  });
});
