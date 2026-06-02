import { renderWithProviders } from "../../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { ChallengesGrid } from "../../../trips/challenges/ChallengesGrid";

describe("ChallengesGrid", () => {
  it("should render empty state when no challenges", () => {
    const noop = () => undefined;
    renderWithProviders(<ChallengesGrid challenges={[]} onSelectChallenge={noop} />);

    expect(screen.getByText("No challenges available yet")).toBeOnTheScreen();
    expect(screen.getByText("Check back later for new challenges!")).toBeOnTheScreen();
  });
});
