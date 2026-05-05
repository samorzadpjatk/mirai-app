import React from "react";
import { Text } from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { AssignedGroupsCard } from "../../../trips/challenges/AssignedGroupsCard";

describe("AssignedGroupsCard", () => {
  const mockGroups = [
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
    const { queryByText } = renderWithProviders(
      <AssignedGroupsCard groups={[]} />
    );
    expect(queryByText("Assigned to Groups")).toBeNull();
  });

  it("should render the title", () => {
    const { getByText } = renderWithProviders(
      <AssignedGroupsCard groups={mockGroups} />
    );
    expect(getByText("Assigned to Groups")).toBeTruthy();
  });

  it("should render all group names", () => {
    const { getByText } = renderWithProviders(
      <AssignedGroupsCard groups={mockGroups} />
    );
    expect(getByText("Test Group 1")).toBeTruthy();
    expect(getByText("Test Group 2")).toBeTruthy();
    expect(getByText("Test Group 3")).toBeTruthy();
  });

  it("should render leader info when organizer exists with full name", () => {
    const { getByText } = renderWithProviders(
      <AssignedGroupsCard groups={[mockGroups[0]]} />
    );
    expect(getByText("Leader: John Doe")).toBeTruthy();
  });

  it("should render leader info when organizer exists with partial name", () => {
    const { getByText } = renderWithProviders(
      <AssignedGroupsCard groups={[mockGroups[2]]} />
    );
    expect(getByText("Leader: Jane")).toBeTruthy();
  });

  it("should not render leader info when organizer is null", () => {
    const { queryByText } = renderWithProviders(
      <AssignedGroupsCard groups={[mockGroups[1]]} />
    );
    expect(queryByText(/Leader:/)).toBeNull();
  });

  it("should render with correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <AssignedGroupsCard groups={mockGroups} />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should handle single group", () => {
    const singleGroup = [mockGroups[0]];
    const { getByText } = renderWithProviders(
      <AssignedGroupsCard groups={singleGroup} />
    );
    expect(getByText("Test Group 1")).toBeTruthy();
    expect(getByText("Assigned to Groups")).toBeTruthy();
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
    const { getByText, queryByText } = renderWithProviders(
      <AssignedGroupsCard groups={groupWithNullOrganizer} />
    );
    expect(getByText("Test Group 4")).toBeTruthy();
    expect(queryByText(/Leader: null/)).toBeFalsy();
  });
});
