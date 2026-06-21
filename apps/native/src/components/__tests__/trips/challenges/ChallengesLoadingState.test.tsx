import { screen } from "@testing-library/react-native";
import { ChallengesLoadingState } from "../../../trips/challenges/ChallengesLoadingState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengesLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-state");
    expect(view).toBeTruthy();
  });

  it("should render skeleton card placeholders", () => {
    renderWithProviders(<ChallengesLoadingState />);
    expect(screen.getByTestId("challenges-loading-card-0-0")).toBeTruthy();
  });

  it("should have flex container styling", () => {
    renderWithProviders(<ChallengesLoadingState />);
    const view = screen.getByTestId("challenges-loading-state");
    expect(view.props.style).toBeTruthy();
  });
});
