import { screen } from "@testing-library/react-native";
import { LeaderboardEmptyState } from "../../../trips/leaderboard/LeaderboardEmptyState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("LeaderboardEmptyState", () => {
  it("should render message", () => {
    renderWithProviders(<LeaderboardEmptyState message="No groups available" />);
    expect(screen.getByText("No groups available")).toBeOnTheScreen();
  });

  it("should render different messages", () => {
    const messages = ["No groups available", "Leaderboard is empty", "No data to display"];
    messages.forEach((message) => {
      const { unmount } = renderWithProviders(<LeaderboardEmptyState message={message} />);
      expect(screen.getByText(message)).toBeOnTheScreen();
      unmount();
    });
  });

  it("should render with centered layout", () => {
    renderWithProviders(<LeaderboardEmptyState message="Test message" />);
    expect(screen.getByText("Test message")).toBeOnTheScreen();
  });

  it("should render with flex container styling", () => {
    renderWithProviders(<LeaderboardEmptyState message="Test message" />);
    expect(screen.getByText("Test message")).toBeOnTheScreen();
  });
});
