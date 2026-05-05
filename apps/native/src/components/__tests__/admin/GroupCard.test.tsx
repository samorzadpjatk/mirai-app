import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { GroupCard } from "../../admin/groups/GroupCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

describe("GroupCard", () => {
  const mockGroup = {
    id: "group-1",
    name: "Test Group",
    coins: 150,
    _count: { participants: 5 },
    organizer: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
    },
  };

  const mockOnAddCoins = jest.fn();
  const mockOnRemoveCoins = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders group name", () => {
    const { getByText } = renderWithProviders(
      <GroupCard
        group={mockGroup}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("Test Group")).toBeTruthy();
  });

  it("renders organizer name", () => {
    const { getByText } = renderWithProviders(
      <GroupCard
        group={mockGroup}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("Organizer: John Doe")).toBeTruthy();
  });

  it("renders coin count", () => {
    const { getByText } = renderWithProviders(
      <GroupCard
        group={mockGroup}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("150")).toBeTruthy();
  });

  it("renders member count", () => {
    const { getByText } = renderWithProviders(
      <GroupCard
        group={mockGroup}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("5 members")).toBeTruthy();
  });

  it("calls onAddCoins when add button is pressed", () => {
    const { getByText } = renderWithProviders(
      <GroupCard
        group={mockGroup}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    fireEvent.press(getByText("Add Coins"));
    expect(mockOnAddCoins).toHaveBeenCalledWith(mockGroup);
  });

  it("calls onRemoveCoins when remove button is pressed", () => {
    const { getByText } = renderWithProviders(
      <GroupCard
        group={mockGroup}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    fireEvent.press(getByText("Remove Coins"));
    expect(mockOnRemoveCoins).toHaveBeenCalledWith(mockGroup);
  });

  it("renders with zero coins", () => {
    const groupWithZeroCoins = { ...mockGroup, coins: 0 };
    const { getByText } = renderWithProviders(
      <GroupCard
        group={groupWithZeroCoins}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("0")).toBeTruthy();
  });

  it("renders with single member", () => {
    const groupWithOneMember = { ...mockGroup, _count: { participants: 1 } };
    const { getByText } = renderWithProviders(
      <GroupCard
        group={groupWithOneMember}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("1 members")).toBeTruthy();
  });

  it("renders without organizer", () => {
    const groupWithoutOrganizer = { ...mockGroup, organizer: null };
    const { queryByText } = renderWithProviders(
      <GroupCard
        group={groupWithoutOrganizer}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(queryByText(/Organizer:/)).toBeNull();
  });

  it("renders organizer with only first name", () => {
    const groupWithPartialOrganizer = {
      ...mockGroup,
      organizer: { id: "user-1", firstName: "Jane", lastName: null },
    };
    const { getByText } = renderWithProviders(
      <GroupCard
        group={groupWithPartialOrganizer}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("Organizer: Jane")).toBeTruthy();
  });

  it("renders organizer with only last name", () => {
    const groupWithPartialOrganizer = {
      ...mockGroup,
      organizer: { id: "user-1", firstName: null, lastName: "Smith" },
    };
    const { getByText } = renderWithProviders(
      <GroupCard
        group={groupWithPartialOrganizer}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("Organizer: Smith")).toBeTruthy();
  });

  it("renders with large coin count", () => {
    const groupWithManyCoins = { ...mockGroup, coins: 999999 };
    const { getByText } = renderWithProviders(
      <GroupCard
        group={groupWithManyCoins}
        onAddCoins={mockOnAddCoins}
        onRemoveCoins={mockOnRemoveCoins}
      />
    );

    expect(getByText("999999")).toBeTruthy();
  });
});
