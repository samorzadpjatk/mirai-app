import { fireEvent, screen } from "@testing-library/react-native";
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
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("Full Rankings")).toBeOnTheScreen();
  });

  it("should render subtitle", () => {
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("Global Standings")).toBeOnTheScreen();
  });

  it("should render all group names", () => {
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("Group 1")).toBeOnTheScreen();
    expect(screen.getByText("Group 2")).toBeOnTheScreen();
    expect(screen.getByText("Group 3")).toBeOnTheScreen();
  });

  it("should render all group ranks", () => {
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("4")).toBeOnTheScreen();
    expect(screen.getByText("5")).toBeOnTheScreen();
    expect(screen.getByText("6")).toBeOnTheScreen();
  });

  it("should call onPressGroup when a group is pressed", () => {
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    const groupElements = screen.getAllByText(/Group \d/);
    fireEvent.press(groupElements[0]!);
    expect(mockOnPressGroup).toHaveBeenCalledWith(mockGroups[0]!);
  });

  it("should render empty state when no groups", () => {
    renderWithProviders(<LeaderboardRankingsSection groups={[]} onPressGroup={mockOnPressGroup} />);
    expect(screen.getByText("No groups yet")).toBeOnTheScreen();
    expect(screen.getByText("Groups will appear here as they join the trip")).toBeOnTheScreen();
  });

  it("should render without onPressGroup handler", () => {
    renderWithProviders(<LeaderboardRankingsSection groups={mockGroups} />);
    expect(screen.getByText("Group 1")).toBeOnTheScreen();
  });

  it("should handle single group", () => {
    const singleGroup = [mockGroups[0]!];
    renderWithProviders(
      <LeaderboardRankingsSection groups={singleGroup} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("Group 1")).toBeOnTheScreen();
    expect(screen.getByText("4")).toBeOnTheScreen();
  });

  it("should render with container styling", () => {
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByTestId("leaderboard-rankings-section")).toBeOnTheScreen();
  });

  it("should mark current user group with YOUR GROUP badge", () => {
    renderWithProviders(
      <LeaderboardRankingsSection groups={mockGroups} onPressGroup={mockOnPressGroup} />,
    );
    expect(screen.getByText("YOUR GROUP")).toBeOnTheScreen();
  });
});
