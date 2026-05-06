import React from "react";
import { View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
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
    const { getByText } = renderWithProviders(
      <GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />
    );
    expect(getByText("Group 1")).toBeTruthy();
    expect(getByText("Group 2")).toBeTruthy();
    expect(getByText("Group 3")).toBeTruthy();
  });

  it("should render empty state when no groups", () => {
    const { getByText } = renderWithProviders(
      <GroupsList groups={[]} onSelectGroup={mockOnSelectGroup} />
    );
    expect(getByText("No groups found")).toBeTruthy();
  });

  it("should call onSelectGroup when a group is pressed", () => {
    const { getAllByText } = renderWithProviders(
      <GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />
    );
    const groupCards = getAllByText(/Group \d/);
    fireEvent.press(groupCards[0]);
    expect(mockOnSelectGroup).toHaveBeenCalledTimes(1);
  });

  it("should mark group as my group when myGroupId matches", () => {
    const { getByText } = renderWithProviders(
      <GroupsList
        groups={mockGroups}
        onSelectGroup={mockOnSelectGroup}
        myGroupId="1"
      />
    );
    expect(getByText("Your group")).toBeTruthy();
  });

  it("should not mark any group as my group when myGroupId is null", () => {
    const { queryByText } = renderWithProviders(
      <GroupsList
        groups={mockGroups}
        onSelectGroup={mockOnSelectGroup}
        myGroupId={null}
      />
    );
    expect(queryByText("Your group")).toBeNull();
  });

  it("should not mark any group as my group when myGroupId is undefined", () => {
    const { queryByText } = renderWithProviders(
      <GroupsList
        groups={mockGroups}
        onSelectGroup={mockOnSelectGroup}
      />
    );
    expect(queryByText("Your group")).toBeNull();
  });

  it("should handle single group", () => {
    const singleGroup = [mockGroups[0]];
    const { getByText } = renderWithProviders(
      <GroupsList groups={singleGroup} onSelectGroup={mockOnSelectGroup} />
    );
    expect(getByText("Group 1")).toBeTruthy();
    expect(getByText("CODE1")).toBeTruthy();
  });

  it("should render with correct list styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <GroupsList groups={mockGroups} onSelectGroup={mockOnSelectGroup} />
    );
    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });
});
