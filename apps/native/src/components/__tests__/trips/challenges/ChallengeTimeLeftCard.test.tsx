import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeTimeLeftCard } from "../../../trips/challenges/ChallengeTimeLeftCard";

describe("ChallengeTimeLeftCard", () => {
  let setIntervalSpy: jest.SpiedFunction<typeof setInterval>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    setIntervalSpy = jest.spyOn(globalThis, "setInterval");
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it("renders nothing visible when no timing data is provided", () => {
    renderWithProviders(<ChallengeTimeLeftCard phaseLabel="Submission" />);

    expect(screen.queryByText("Time left")).toBeNull();
    expect(screen.queryByText("Schedule")).toBeNull();
  });

  it("renders schedule view when status is VISIBLE", () => {
    renderWithProviders(<ChallengeTimeLeftCard phaseLabel="Submission" status="VISIBLE" />);

    expect(screen.getByText("Schedule")).toBeOnTheScreen();
    expect(screen.getByText("Not active yet")).toBeOnTheScreen();
  });

  it("renders the recurring countdown and reset text", () => {
    renderWithProviders(
      <ChallengeTimeLeftCard
        phaseLabel="Submission"
        isRecurring={true}
        dailyStartTime="09:00"
        dailyEndTime="17:00"
        startTime={new Date("2024-01-15T10:00:00Z")}
        endTime={new Date("2024-01-20T14:00:00Z")}
      />,
    );

    expect(screen.getByText("Time left")).toBeOnTheScreen();
    expect(screen.getByText("Submission")).toBeOnTheScreen();
    expect(screen.getByText("Daily reset at 17:00")).toBeOnTheScreen();
  });

  it("renders voting-specific countdown text", () => {
    renderWithProviders(
      <ChallengeTimeLeftCard
        phaseLabel="Voting"
        startTime={new Date("2024-01-15T10:00:00Z")}
        endTime={new Date("2024-01-15T14:00:00Z")}
      />,
    );

    expect(screen.getByText("Voting")).toBeOnTheScreen();
    expect(screen.getByText(/Duration-based voting/)).toBeOnTheScreen();
  });

  it("updates on an interval", () => {
    renderWithProviders(
      <ChallengeTimeLeftCard
        phaseLabel="Submission"
        startTime={new Date("2024-01-15T10:00:00Z")}
        endTime={new Date("2024-01-15T14:00:00Z")}
      />,
    );

    expect(setIntervalSpy).toHaveBeenCalled();
  });
});
