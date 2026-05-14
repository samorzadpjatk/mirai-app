import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { LeaderboardListItem } from "../../../trips/leaderboard/LeaderboardListItem";
import type { RankedGroup } from "../../../trips/leaderboard/types";

describe("LeaderboardListItem", () => {
  const mockGroup: RankedGroup = {
    id: "1",
    name: "Test Group",
    image: null,
    coins: 1000,
    memberCount: 5,
    rank: 3,
    isCurrentUserGroup: false,
  };
  const mockOnPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders group details", () => {
    renderWithProviders(<LeaderboardListItem group={mockGroup} onPress={mockOnPress} />);
    expect(screen.getByText("3")).toBeOnTheScreen();
    expect(screen.getByText("Test Group")).toBeOnTheScreen();
    expect(screen.getByText("5 Members active")).toBeOnTheScreen();
    expect(screen.getByText("1,000 pts")).toBeOnTheScreen();
    expect(screen.getByText("T")).toBeOnTheScreen();
  });

  it("renders an image when available", () => {
    const groupWithImage = { ...mockGroup, image: "https://example.com/image.jpg" };
    renderWithProviders(<LeaderboardListItem group={groupWithImage} onPress={mockOnPress} />);
    const image = screen.getByTestId("group-image");
    const source = image.props.source as { uri: string };
    expect(source.uri).toBe("https://example.com/image.jpg");
  });

  it("calls onPress when pressed", () => {
    renderWithProviders(<LeaderboardListItem group={mockGroup} onPress={mockOnPress} />);
    fireEvent.press(screen.getByTestId("leaderboard-item"));
    expect(mockOnPress).toHaveBeenCalledWith(mockGroup);
  });

  it("shows the current user badge", () => {
    const userGroup = { ...mockGroup, isCurrentUserGroup: true };
    renderWithProviders(<LeaderboardListItem group={userGroup} onPress={mockOnPress} />);
    expect(screen.getByText("YOUR GROUP")).toBeOnTheScreen();
  });
});
