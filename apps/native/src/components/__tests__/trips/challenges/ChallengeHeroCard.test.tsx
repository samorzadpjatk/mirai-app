import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeHeroCard } from "../../../trips/challenges/ChallengeHeroCard";

jest.mock("react-native", () => {
  const React = require("react");
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    ImageBackground: ({ children }: { children: React.ReactNode }) =>
      React.createElement(actual.View, null, children),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

describe("ChallengeHeroCard", () => {
  const baseProps = {
    name: "Test Challenge",
    points: 100,
    isSelected: false,
  };

  it("renders the hero labels", () => {
    const { getByText } = renderWithProviders(<ChallengeHeroCard {...baseProps} />);

    expect(getByText("Test Challenge")).toBeTruthy();
    expect(getByText("100 pts")).toBeTruthy();
    expect(getByText("Visible")).toBeTruthy();
    expect(getByText("Type")).toBeTruthy();
    expect(getByText("Photo")).toBeTruthy();
    expect(getByText("Scoring")).toBeTruthy();
    expect(getByText("Speed")).toBeTruthy();
    expect(getByText("Ends")).toBeTruthy();
    expect(getByText("One-time")).toBeTruthy();
  });

  it("renders selected and explicit status labels", () => {
    const { getByText, rerender } = renderWithProviders(
      <ChallengeHeroCard {...baseProps} isSelected={true} />
    );

    expect(getByText("Active")).toBeTruthy();

    rerender(<ChallengeHeroCard {...baseProps} status="VOTING_PHASE" />);
    expect(getByText("Voting")).toBeTruthy();
  });

  it("renders custom submission and scoring labels", () => {
    const { getByText } = renderWithProviders(
      <ChallengeHeroCard
        {...baseProps}
        submissionType="MULTI_IMAGE"
        scoringCategory="JUDGED_STAFF"
      />
    );

    expect(getByText("Multi Photo")).toBeTruthy();
    expect(getByText("Staff Judged")).toBeTruthy();
  });

  it("renders podium points when provided", () => {
    const { getByText } = renderWithProviders(
      <ChallengeHeroCard
        {...baseProps}
        firstPlacePoints={150}
        secondPlacePoints={100}
        thirdPlacePoints={50}
      />
    );

    expect(getByText("1st")).toBeTruthy();
    expect(getByText("2nd")).toBeTruthy();
    expect(getByText("3rd")).toBeTruthy();
    expect(getByText("150")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
  });
});
