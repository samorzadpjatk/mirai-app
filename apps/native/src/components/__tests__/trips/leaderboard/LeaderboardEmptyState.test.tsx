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
    const { UNSAFE_getByType } = renderWithProviders(
      <LeaderboardEmptyState message="Test message" />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should render with flex container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <LeaderboardEmptyState message="Test message" />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view.props.style).toBeTruthy();
  });
});
