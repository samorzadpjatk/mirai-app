import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeDetailsCard } from "../../../trips/challenges/ChallengeDetailsCard";

describe("ChallengeDetailsCard", () => {
  const baseChallenge = { submissionType: "IMAGE", scoringCategory: "SPEED", isRecurring: false };

  it("renders the submission window fallback", () => {
    const { getByText } = renderWithProviders(<ChallengeDetailsCard challenge={baseChallenge} />);
    expect(getByText("No time limit")).toBeTruthy();
  });

  it("renders a date range for non-recurring challenges", () => {
    const challenge = { ...baseChallenge, startTime: new Date("2024-01-01T10:00:00Z"), endTime: new Date("2024-01-01T12:00:00Z") };
    const { getByText } = renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(getByText(/2024/)).toBeTruthy();
  });

  it("renders the recurring daily window", () => {
    const challenge = { ...baseChallenge, isRecurring: true, dailyStartTime: "09:00", dailyEndTime: "17:00" };
    const { getByText } = renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(getByText("Daily 09:00 - 17:00")).toBeTruthy();
  });

  it("renders peer voting details", () => {
    const challenge = { ...baseChallenge, scoringCategory: "PEER_VOTING", votingStartTime: new Date("2024-01-01T10:00:00Z"), votingEndTime: new Date("2024-01-03T10:00:00Z") };
    const { getByText } = renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(getByText("Voting")).toBeTruthy();
    expect(getByText(/Duration: 2 days/)).toBeTruthy();
  });

  it("renders the organizer fallback when voting duration is invalid", () => {
    const challenge = { ...baseChallenge, scoringCategory: "PEER_VOTING", votingStartTime: new Date("2024-01-01T10:00:00Z"), votingEndTime: new Date("2024-01-01T10:00:00Z") };
    const { getByText } = renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(getByText(/Duration set by organizer/)).toBeTruthy();
  });

  it("renders the target location when coordinates are provided", () => {
    const challenge = { ...baseChallenge, targetLatitude: 52.2297, targetLongitude: 21.0122 };
    const { getByText } = renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(getByText("Target location")).toBeTruthy();
    expect(getByText("52.2297, 21.0122")).toBeTruthy();
  });
});
