import React from "react";
import { View, Alert } from "react-native";
import type * as ReactNative from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeHeroCard } from "../../../trips/challenges/ChallengeHeroCard";

interface ImageBackgroundMockProps {
  children?: React.ReactNode;
}

interface LinearGradientMockProps {
  children?: React.ReactNode;
}

jest.mock("expo-linear-gradient", () => {
  const { View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    LinearGradient: ({ children }: LinearGradientMockProps) => <View>{children}</View>,
  };
});

describe("ChallengeHeroCard", () => {
  const baseProps = {
    name: "Test Challenge",
    points: 100,
    isSelected: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

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
      <ChallengeHeroCard {...baseProps} isSelected={true} />,
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
      />,
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
      />,
    );

    expect(getByText("1st")).toBeTruthy();
    expect(getByText("2nd")).toBeTruthy();
    expect(getByText("3rd")).toBeTruthy();
    expect(getByText("150")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
  });
});
