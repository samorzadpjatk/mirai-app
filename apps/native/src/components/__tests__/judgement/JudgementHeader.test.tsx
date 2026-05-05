import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { JudgementHeader } from "../../judgement/JudgementHeader";

jest.mock("~/stores/judgement", () => ({
  useJudgement: jest.fn(),
}));

const mockUseJudgement = require("~/stores/judgement").useJudgement as jest.Mock;

describe("JudgementHeader", () => {
  const defaultProps = { tripId: "trip-1", challengeId: "challenge-1" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJudgement.mockReturnValue({
      challengeName: "Test Challenge",
      pendingCount: 5,
      stats: { approved: 10, rejected: 2 },
    });
  });

  it("should render challenge name", () => {
    const { getByText } = renderWithProviders(<JudgementHeader {...defaultProps} />);
    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("should render pending count", () => {
    const { getByText } = renderWithProviders(<JudgementHeader {...defaultProps} />);
    expect(getByText(/5 pending/)).toBeTruthy();
  });

  it("should render approved count", () => {
    const { getByText } = renderWithProviders(<JudgementHeader {...defaultProps} />);
    expect(getByText(/10 approved/)).toBeTruthy();
  });

  it("should render rejected count", () => {
    const { getByText } = renderWithProviders(<JudgementHeader {...defaultProps} />);
    expect(getByText(/2 rejected/)).toBeTruthy();
  });

  it("should render full stats line", () => {
    const { getByText } = renderWithProviders(<JudgementHeader {...defaultProps} />);
    expect(getByText("5 pending • 10 approved • 2 rejected")).toBeTruthy();
  });

  it("should use useJudgement hook with correct params", () => {
    renderWithProviders(<JudgementHeader tripId="trip-2" challengeId="challenge-2" />);
    expect(mockUseJudgement).toHaveBeenCalledWith("trip-2", "challenge-2");
  });
});

describe("JudgementHeader - Different Stats", () => {
  it("should render with zero counts", () => {
    mockUseJudgement.mockReturnValueOnce({ challengeName: "Empty Challenge", pendingCount: 0, stats: { approved: 0, rejected: 0 } });
    const { getByText } = renderWithProviders(<JudgementHeader tripId="trip-1" challengeId="challenge-1" />);
    expect(getByText("Empty Challenge")).toBeTruthy();
    expect(getByText("0 pending • 0 approved • 0 rejected")).toBeTruthy();
  });

  it("should render with large counts", () => {
    mockUseJudgement.mockReturnValueOnce({ challengeName: "Popular Challenge", pendingCount: 999, stats: { approved: 5000, rejected: 100 } });
    const { getByText } = renderWithProviders(<JudgementHeader tripId="trip-1" challengeId="challenge-1" />);
    expect(getByText("Popular Challenge")).toBeTruthy();
    expect(getByText("999 pending • 5000 approved • 100 rejected")).toBeTruthy();
  });
});
