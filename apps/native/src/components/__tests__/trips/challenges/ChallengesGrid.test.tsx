import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengesGrid } from "../../../trips/challenges/ChallengesGrid";

describe("ChallengesGrid", () => {
  it("should render empty state when no challenges", () => {
    const noop = () => undefined;
    const { getByText } = renderWithProviders(
      <ChallengesGrid challenges={[]} onSelectChallenge={noop} />
    );

    expect(getByText("No challenges available yet")).toBeTruthy();
    expect(getByText("Check back later for new challenges!")).toBeTruthy();
  });
});
