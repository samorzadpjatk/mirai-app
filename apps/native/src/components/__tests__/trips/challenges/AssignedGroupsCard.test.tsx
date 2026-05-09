import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { AssignedGroupsCard } from "../../../trips/challenges/AssignedGroupsCard";
import type { AssignedGroup } from "../../../trips/challenges/AssignedGroupsCard";

describe("AssignedGroupsCard", () => {
  const mockGroups: AssignedGroup[] = [
    {
      id: "1",
      group: {
        name: "Test Group 1",
        organizer: {
          firstName: "John",
          lastName: "Doe",
        },
      },
    },
    {
      id: "2",
      group: {
        name: "Test Group 2",
        organizer: null,
      },
    },
    {
      id: "3",
      group: {
        name: "Test Group 3",
        organizer: {
          firstName: "Jane",
          lastName: null,
        },
      },
    },
  ];

  it("should render null when groups array is empty", () => {
    renderWithProviders(<AssignedGroupsCard groups={[]} />);
    expect(screen.queryByText("Assigned to Groups")).toBeNull();
  });

  it("should render the title", () => {
    renderWithProviders(<AssignedGroupsCard groups={mockGroups} />);
    expect(screen.getByText("Assigned to Groups")).toBeOnTheScreen();
  });

  it("should render all group names", () => {
    renderWithProviders(<AssignedGroupsCard groups={mockGroups} />);
    expect(screen.getByText("Test Group 1")).toBeOnTheScreen();
    expect(screen.getByText("Test Group 2")).toBeOnTheScreen();
    expect(screen.getByText("Test Group 3")).toBeOnTheScreen();
  });

  it("should render leader info when organizer exists with full name", () => {
    renderWithProviders(<AssignedGroupsCard groups={[mockGroups[0]!]} />);
    expect(screen.getByText("Leader: John Doe")).toBeOnTheScreen();
  });

  it("should render leader info when organizer exists with partial name", () => {
    renderWithProviders(<AssignedGroupsCard groups={[mockGroups[2]!]} />);
    expect(screen.getByText("Leader: Jane")).toBeOnTheScreen();
  });

  it("should not render leader info when organizer is null", () => {
    const { queryByText } = renderWithProviders(
      <AssignedGroupsCard groups={[mockGroups[1]!]} />
    );
    expect(queryByText(/Leader:/)).toBeNull();
  });

  it("should render with correct container styling", () => {
    renderWithProviders(<AssignedGroupsCard groups={mockGroups} />);
    expect(screen.getByTestId("assigned-groups-card")).toBeOnTheScreen();
  });

  it("should handle single group", () => {
    const singleGroup = [mockGroups[0]!];
    renderWithProviders(<AssignedGroupsCard groups={singleGroup} />);
    expect(screen.getByText("Test Group 1")).toBeOnTheScreen();
    expect(screen.getByText("Assigned to Groups")).toBeOnTheScreen();
  });

  it("should handle organizer with null first and last name", () => {
    const groupWithNullOrganizer = [
      {
        id: "4",
        group: {
          name: "Test Group 4",
          organizer: {
            firstName: null,
            lastName: null,
          },
        },
      },
    ];
    renderWithProviders(<AssignedGroupsCard groups={groupWithNullOrganizer} />);
    expect(screen.getByText("Test Group 4")).toBeOnTheScreen();
    expect(screen.queryByText(/Leader: null/)).toBeFalsy();
  });
});
