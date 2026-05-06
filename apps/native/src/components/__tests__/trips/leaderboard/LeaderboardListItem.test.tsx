import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { LeaderboardListItem } from "../../../trips/leaderboard/LeaderboardListItem";
import type { RankedGroup } from "../../../trips/leaderboard/types";

describe("LeaderboardListItem", () => {
  const mockGroup: RankedGroup = { id: "1", name: "Test Group", image: null, coins: 1000, memberCount: 5, rank: 3, isCurrentUserGroup: false };
  const mockOnPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders group details", () => {
    const { getByText } = renderWithProviders(<LeaderboardListItem group={mockGroup} onPress={mockOnPress} />);
    expect(getByText("3")).toBeTruthy();
    expect(getByText("Test Group")).toBeTruthy();
    expect(getByText("5 Members active")).toBeTruthy();
    expect(getByText("1000 pts")).toBeTruthy();
    expect(getByText("T")).toBeTruthy();
  });

  it("renders an image when available", () => {
    const groupWithImage = { ...mockGroup, image: "https://example.com/image.jpg" };
    const { UNSAFE_getByType } = renderWithProviders(<LeaderboardListItem group={groupWithImage} onPress={mockOnPress} />);
    const image = UNSAFE_getByType(Image);
    const source = image.props.source as { uri: string };
    expect(source.uri).toBe("https://example.com/image.jpg");
  });

  it("calls onPress when pressed", () => {
    const { UNSAFE_getByType } = renderWithProviders(<LeaderboardListItem group={mockGroup} onPress={mockOnPress} />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(mockOnPress).toHaveBeenCalledWith(mockGroup);
  });

  it("shows the current user badge", () => {
    const userGroup = { ...mockGroup, isCurrentUserGroup: true };
    const { getByText } = renderWithProviders(<LeaderboardListItem group={userGroup} onPress={mockOnPress} />);
    expect(getByText("YOUR GROUP")).toBeTruthy();
  });
});
