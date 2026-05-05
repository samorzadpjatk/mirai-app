import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeTimeLeftCard } from "../../../trips/challenges/ChallengeTimeLeftCard";

describe("ChallengeTimeLeftCard", () => {
  let setIntervalSpy: jest.SpiedFunction<typeof setInterval>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    setIntervalSpy = jest.spyOn(global, "setInterval");
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it("renders nothing visible when no timing data is provided", () => {
    const { queryByText } = renderWithProviders(
      <ChallengeTimeLeftCard phaseLabel="Submission" />
    );

    expect(queryByText("Time left")).toBeNull();
    expect(queryByText("Schedule")).toBeNull();
  });

  it("renders schedule view when status is VISIBLE", () => {
    const { getByText } = renderWithProviders(
      <ChallengeTimeLeftCard phaseLabel="Submission" status="VISIBLE" />
    );

    expect(getByText("Schedule")).toBeTruthy();
    expect(getByText("Not active yet")).toBeTruthy();
  });

  it("renders the recurring countdown and reset text", () => {
    const { getByText } = renderWithProviders(
      <ChallengeTimeLeftCard
        phaseLabel="Submission"
        isRecurring={true}
        dailyStartTime="09:00"
        dailyEndTime="17:00"
        startTime={new Date("2024-01-15T10:00:00Z")}
        endTime={new Date("2024-01-20T14:00:00Z")}
      />
    );

    expect(getByText("Time left")).toBeTruthy();
    expect(getByText("Submission")).toBeTruthy();
    expect(getByText("Daily reset at 17:00")).toBeTruthy();
  });

  it("renders voting-specific countdown text", () => {
    const { getByText } = renderWithProviders(
      <ChallengeTimeLeftCard
        phaseLabel="Voting"
        startTime={new Date("2024-01-15T10:00:00Z")}
        endTime={new Date("2024-01-15T14:00:00Z")}
      />
    );

    expect(getByText("Voting")).toBeTruthy();
    expect(getByText(/Duration-based voting/)).toBeTruthy();
  });

  it("updates on an interval", () => {
    renderWithProviders(
      <ChallengeTimeLeftCard
        phaseLabel="Submission"
        startTime={new Date("2024-01-15T10:00:00Z")}
        endTime={new Date("2024-01-15T14:00:00Z")}
      />
    );

    expect(setIntervalSpy).toHaveBeenCalled();
  });
});
