import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { JudgementContent } from "../../judgement/JudgementContent";

jest.mock("~/stores/judgement", () => ({
  useJudgement: jest.fn(),
}));

jest.mock("~/stores/judgement/judgementStores", () => ({
  judgementStore: {
    getState: jest.fn(() => ({ resetDismissedIds: jest.fn() })),
  },
}));

jest.mock("~/components/judgement/JudgementHeader", () => ({
  JudgementHeader: () => {
    const { View } = require("react-native");
    return <View testID="judgement-header" />;
  },
}));

jest.mock("~/components/judgement/CardStack", () => ({
  CardStack: () => {
    const { View } = require("react-native");
    return <View testID="card-stack" />;
  },
}));

const mockUseJudgement = require("~/stores/judgement").useJudgement as jest.Mock;

describe("JudgementContent", () => {
  const defaultProps = { tripId: "trip-1", challengeId: "challenge-1" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJudgement.mockReturnValue({ isLoading: false });
  });

  it("should render header when not loading", () => {
    const { getByTestId } = renderWithProviders(<JudgementContent {...defaultProps} />);
    expect(getByTestId("judgement-header")).toBeTruthy();
  });

  it("should render card stack when not loading", () => {
    const { getByTestId } = renderWithProviders(<JudgementContent {...defaultProps} />);
    expect(getByTestId("card-stack")).toBeTruthy();
  });

  it("should render with provided tripId and challengeId", () => {
    const { getByTestId } = renderWithProviders(<JudgementContent tripId="trip-2" challengeId="challenge-2" />);
    expect(getByTestId("judgement-header")).toBeTruthy();
    expect(getByTestId("card-stack")).toBeTruthy();
  });

  it("should render loading indicator when isLoading is true", () => {
    mockUseJudgement.mockReturnValueOnce({ isLoading: true });
    const { UNSAFE_getByType } = renderWithProviders(<JudgementContent tripId="trip-1" challengeId="challenge-1" />);
    expect(UNSAFE_getByType("ActivityIndicator")).toBeTruthy();
  });
});
