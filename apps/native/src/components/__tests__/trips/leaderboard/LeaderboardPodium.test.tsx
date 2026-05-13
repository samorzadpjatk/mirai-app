import React from "react";
import type { Text as TextType } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { LeaderboardPodium } from "../../../trips/leaderboard/LeaderboardPodium";
import type { RankedGroup } from "../../../trips/leaderboard/types";

jest.mock("@expo/vector-icons", () => {
  const MockReact = jest.requireActual<typeof React>("react");
  const { Text: MockText } = jest.requireActual<{ Text: typeof TextType }>("react-native");
  return {
    Ionicons: ({ name }: { name: string }) =>
      MockReact.createElement(MockText, { testID: `icon-${name}` }, name),
  };
});

describe("LeaderboardPodium", () => {
  const mockTopThree: RankedGroup[] = [
    {
      id: "1",
      name: "First Place Group",
      image: "https://example.com/first.jpg",
      coins: 5000,
      memberCount: 10,
      rank: 1,
      isCurrentUserGroup: true,
    },
    {
      id: "2",
      name: "Second Place Group",
      image: null,
      coins: 3500,
      memberCount: 8,
      rank: 2,
      isCurrentUserGroup: false,
    },
    {
      id: "3",
      name: "Third Place Group",
      image: "https://example.com/third.jpg",
      coins: 2000,
      memberCount: 6,
      rank: 3,
      isCurrentUserGroup: false,
    },
  ];
  const mockOnPressGroup = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders the podium groups", () => {
    renderWithProviders(
      <LeaderboardPodium topThree={mockTopThree} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("First Place Group")).toBeOnTheScreen();
    expect(screen.getByText("Second Place Group")).toBeOnTheScreen();
    expect(screen.getByText("Third Place Group")).toBeOnTheScreen();
  });

  it("renders podium icons and badges", () => {
    renderWithProviders(
      <LeaderboardPodium topThree={mockTopThree} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByTestId("icon-ribbon")).toBeOnTheScreen();
    expect(screen.getAllByTestId("icon-trophy").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("1ST")).toBeOnTheScreen();
    expect(screen.getByText("2ND")).toBeOnTheScreen();
    expect(screen.getByText("3RD")).toBeOnTheScreen();
  });

  it("calls onPressGroup for the first place group", () => {
    renderWithProviders(
      <LeaderboardPodium topThree={mockTopThree} onPressGroup={mockOnPressGroup} />,
    );
    fireEvent.press(screen.getByText("First Place Group"));
    expect(mockOnPressGroup).toHaveBeenCalledWith(mockTopThree[0]);
  });
});
