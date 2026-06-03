import { screen } from "@testing-library/react-native";
import { ChallengeDetailsCard } from "../../../trips/challenges/ChallengeDetailsCard";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengeDetailsCard", () => {
  const baseChallenge = { submissionType: "IMAGE", scoringCategory: "SPEED", isRecurring: false };

  it("renders the submission window fallback", () => {
    renderWithProviders(<ChallengeDetailsCard challenge={baseChallenge} />);
    expect(screen.getByText("No time limit")).toBeOnTheScreen();
  });

  it("renders a date range for non-recurring challenges", () => {
    const challenge = {
      ...baseChallenge,
      startTime: new Date("2024-01-01T10:00:00Z"),
      endTime: new Date("2024-01-01T12:00:00Z"),
    };
    renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(screen.getByText(/2024/)).toBeOnTheScreen();
  });

  it("renders the recurring daily window", () => {
    const challenge = {
      ...baseChallenge,
      isRecurring: true,
      dailyStartTime: "09:00",
      dailyEndTime: "17:00",
    };
    renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(screen.getByText("Daily 09:00 - 17:00")).toBeOnTheScreen();
  });

  it("renders peer voting details", () => {
    const challenge = {
      ...baseChallenge,
      scoringCategory: "PEER_VOTING",
      votingStartTime: new Date("2024-01-01T10:00:00Z"),
      votingEndTime: new Date("2024-01-03T10:00:00Z"),
    };
    renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(screen.getByText("Voting")).toBeOnTheScreen();
    expect(screen.getByText(/Duration: 2 days/)).toBeOnTheScreen();
  });

  it("renders the organizer fallback when voting duration is invalid", () => {
    const challenge = {
      ...baseChallenge,
      scoringCategory: "PEER_VOTING",
      votingStartTime: new Date("2024-01-01T10:00:00Z"),
      votingEndTime: new Date("2024-01-01T10:00:00Z"),
    };
    renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(screen.getByText(/Duration set by organizer/)).toBeOnTheScreen();
  });

  it("renders the target location when coordinates are provided", () => {
    const challenge = { ...baseChallenge, targetLatitude: 52.2297, targetLongitude: 21.0122 };
    renderWithProviders(<ChallengeDetailsCard challenge={challenge} />);
    expect(screen.getByText("Target location")).toBeOnTheScreen();
    expect(screen.getByText("52.2297, 21.0122")).toBeOnTheScreen();
  });
});
