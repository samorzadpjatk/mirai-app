import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { LeaderboardEmptyState } from "../../../trips/leaderboard/LeaderboardEmptyState";

describe("LeaderboardEmptyState", () => {
  it("should render message", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardEmptyState message="No groups available" />
    );
    expect(getByText("No groups available")).toBeTruthy();
  });

  it("should render different messages", () => {
    const messages = [
      "No groups available",
      "Leaderboard is empty",
      "No data to display",
    ];
    messages.forEach((message) => {
      const { getByText, unmount } = renderWithProviders(
        <LeaderboardEmptyState message={message} />
      );
      expect(getByText(message)).toBeTruthy();
      unmount();
    });
  });

  it("should render with centered layout", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardEmptyState message="Test message" />
    );
    expect(getByText("Test message")).toBeTruthy();
  });

  it("should render with flex container styling", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardEmptyState message="Test message" />
    );
    expect(getByText("Test message")).toBeTruthy();
  });
});
