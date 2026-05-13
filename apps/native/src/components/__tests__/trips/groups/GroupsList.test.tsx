import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsList } from "../../../trips/groups/GroupsList";
import type { GroupListItem } from "../../../trips/groups/types";

describe("GroupsList", () => {
  const mockGroups: GroupListItem[] = [
    {
      id: "1",
      name: "Group 1",
      code: "CODE1",
      image: null,
      participantCount: 3,
    },
    {
      id: "2",
      name: "Group 2",
      code: "CODE2",
      image: null,
      participantCount: 5,
    },
    {
      id: "3",
      name: "Group 3",
      code: "CODE3",
      image: null,
      participantCount: 2,
    },
  ];

  const mockOnSelectGroup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all group names", () => {
    renderWithProviders(<GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />);
    expect(screen.getByText("Group 1")).toBeOnTheScreen();
    expect(screen.getByText("Group 2")).toBeOnTheScreen();
    expect(screen.getByText("Group 3")).toBeOnTheScreen();
  });

  it("should render empty state when no groups", () => {
    renderWithProviders(<GroupsList groups={[]} onSelectGroup={mockOnSelectGroup} />);
    expect(screen.getByText("No groups found")).toBeOnTheScreen();
  });

  it("should call onSelectGroup when a group is pressed", () => {
    renderWithProviders(<GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />);
    const groupCards = screen.getAllByText(/Group \d/);
    const firstGroupCard = groupCards[0];
    expect(firstGroupCard).toBeDefined();
    fireEvent.press(firstGroupCard!);
    expect(mockOnSelectGroup).toHaveBeenCalledTimes(1);
  });

  it("should mark group as my group when myGroupId matches", () => {
    renderWithProviders(
      <GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} myGroupId="1" />,
    );
    expect(screen.getByText("Your group")).toBeOnTheScreen();
  });

  it("should not mark any group as my group when myGroupId is null", () => {
    renderWithProviders(
      <GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} myGroupId={null} />,
    );
    expect(screen.queryByText("Your group")).toBeNull();
  });

  it("should not mark any group as my group when myGroupId is undefined", () => {
    renderWithProviders(<GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />);
    expect(screen.queryByText("Your group")).toBeNull();
  });

  it("should handle single group", () => {
    const singleGroup = [mockGroups[0]!];
    renderWithProviders(<GroupsList groups={singleGroup} onSelectGroup={mockOnSelectGroup} />);
    expect(screen.getByText("Group 1")).toBeOnTheScreen();
    expect(screen.getByText("CODE1")).toBeOnTheScreen();
  });

  it("should render with correct list styling", () => {
    renderWithProviders(<GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />);
    expect(screen.getByTestId("groups-list")).toBeOnTheScreen();
  });
});
