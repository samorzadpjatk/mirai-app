import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { LeaderboardPodium } from "../../../trips/leaderboard/LeaderboardPodium";
import type { RankedGroup } from "../../../trips/leaderboard/types";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}` }, name),
  };
});

describe("LeaderboardPodium", () => {
  const mockTopThree: RankedGroup[] = [
    { id: "1", name: "First Place Group", image: "https://example.com/first.jpg", coins: 5000, memberCount: 10, rank: 1, isCurrentUserGroup: true },
    { id: "2", name: "Second Place Group", image: null, coins: 3500, memberCount: 8, rank: 2, isCurrentUserGroup: false },
    { id: "3", name: "Third Place Group", image: "https://example.com/third.jpg", coins: 2000, memberCount: 6, rank: 3, isCurrentUserGroup: false },
  ];
  const mockOnPressGroup = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders the podium groups", () => {
    const { getByText } = renderWithProviders(<LeaderboardPodium topThree={mockTopThree} onPressGroup={mockOnPressGroup} />);
    expect(getByText("First Place Group")).toBeTruthy();
    expect(getByText("Second Place Group")).toBeTruthy();
    expect(getByText("Third Place Group")).toBeTruthy();
  });

  it("renders podium icons and badges", () => {
    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(<LeaderboardPodium topThree={mockTopThree} onPressGroup={mockOnPressGroup} />);
    expect(getByTestId("icon-ribbon")).toBeTruthy();
    expect(getAllByTestId("icon-trophy").length).toBeGreaterThanOrEqual(3);
    expect(getByText("1ST")).toBeTruthy();
    expect(getByText("2ND")).toBeTruthy();
    expect(getByText("3RD")).toBeTruthy();
  });

  it("calls onPressGroup for the first place group", () => {
    const { getByText } = renderWithProviders(<LeaderboardPodium topThree={mockTopThree} onPressGroup={mockOnPressGroup} />);
    fireEvent.press(getByText("First Place Group"));
    expect(mockOnPressGroup).toHaveBeenCalledWith(mockTopThree[0]);
  });
});
