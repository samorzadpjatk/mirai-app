import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { GroupManagementCard } from "../../admin/groups/GroupManagementCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

describe("GroupManagementCard", () => {
  const mockGroup = {
    id: "group-1",
    name: "Test Group",
    description: "Test description",
    image: null,
    code: "GROUP-1",
    coins: 200,
    _count: { participants: 8 },
    organizer: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
    },
  };

  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders group summary", () => {
    const { getByText } = renderWithProviders(
      <GroupManagementCard group={mockGroup} onEdit={mockOnEdit} />
    );

    expect(getByText("Test Group")).toBeTruthy();
    expect(getByText("Organizer: John Doe")).toBeTruthy();
    expect(getByText("8")).toBeTruthy();
    expect(getByText("200")).toBeTruthy();
  });

  it("calls onEdit when edit is pressed", () => {
    const { getByText } = renderWithProviders(
      <GroupManagementCard group={mockGroup} onEdit={mockOnEdit} />
    );

    fireEvent.press(getByText("Edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockGroup);
  });

  it("falls back to unassigned organizer text", () => {
    const { getByText } = renderWithProviders(
      <GroupManagementCard
        group={{ ...mockGroup, organizer: null }}
        onEdit={mockOnEdit}
      />
    );

    expect(getByText("Organizer: Unassigned")).toBeTruthy();
  });
});
