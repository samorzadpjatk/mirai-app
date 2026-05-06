import React from "react";
import { View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { LeaderboardRankingsSection } from "../../../trips/leaderboard/LeaderboardRankingsSection";
import type { RankedGroup } from "../../../trips/leaderboard/types";

describe("LeaderboardRankingsSection", () => {
  const mockGroups: RankedGroup[] = [
    {
      id: "1",
      name: "Group 1",
      image: null,
      coins: 1000,
      memberCount: 5,
      rank: 4,
      isCurrentUserGroup: false,
    },
    {
      id: "2",
      name: "Group 2",
      image: null,
      coins: 800,
      memberCount: 4,
      rank: 5,
      isCurrentUserGroup: true,
    },
    {
      id: "3",
      name: "Group 3",
      image: null,
      coins: 600,
      memberCount: 3,
      rank: 6,
      isCurrentUserGroup: false,
    },
  ];

  const mockOnPressGroup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render section title", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("Full Rankings")).toBeTruthy();
  });

  it("should render subtitle", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("Global Standings")).toBeTruthy();
  });

  it("should render all group names", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("Group 1")).toBeTruthy();
    expect(getByText("Group 2")).toBeTruthy();
    expect(getByText("Group 3")).toBeTruthy();
  });

  it("should render all group ranks", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("4")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
    expect(getByText("6")).toBeTruthy();
  });

  it("should call onPressGroup when a group is pressed", () => {
    const { getAllByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    const groupElements = getAllByText(/Group \d/);
    fireEvent.press(groupElements[0]);
    expect(mockOnPressGroup).toHaveBeenCalledWith(mockGroups[0]);
  });

  it("should render empty state when no groups", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={[]} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("No groups yet")).toBeTruthy();
    expect(getByText("Groups will appear here as they join the trip")).toBeTruthy();
  });

  it("should render without onPressGroup handler", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} />
    );
    expect(getByText("Group 1")).toBeTruthy();
  });

  it("should handle single group", () => {
    const singleGroup = [mockGroups[0]];
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={singleGroup} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("Group 1")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
  });

  it("should render with container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should mark current user group with YOUR GROUP badge", () => {
    const { getByText } = renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />
    );
    expect(getByText("YOUR GROUP")).toBeTruthy();
  });
});
