import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ChallengeListItem } from "../../admin/challenges/ChallengeListItem";

describe("ChallengeListItem", () => {
  const mockChallenge = {
    id: "challenge-1",
    tripId: "trip-1",
    title: "Test Challenge",
    description: "Test description",
    basePoints: 100,
    status: "active",
  };

  const mockOnDelete = jest.fn();
  const mockOnDeletePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders challenge title", () => {
    const { getByText } = renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("renders challenge points", () => {
    const { getByText } = renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText("100 PTS")).toBeTruthy();
  });

  it("renders challenge status", () => {
    const { getByText } = renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText("active")).toBeTruthy();
  });

  it("renders challenge description", () => {
    const { getByText } = renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText("Test description")).toBeTruthy();
  });

  it("calls onDeletePress when delete button is pressed", () => {
    const { getAllByText } = renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    const deleteButtons = getAllByText("trash");
    fireEvent.press(deleteButtons[0]);
    expect(mockOnDeletePress).toHaveBeenCalledWith(mockChallenge.id);
  });

  it("renders with different point values", () => {
    const highPointChallenge = { ...mockChallenge, basePoints: 500 };
    const { getByText } = renderWithProviders(
      <ChallengeListItem
        challenge={highPointChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText("500 PTS")).toBeTruthy();
  });

  it("renders without description", () => {
    const challengeWithoutDesc = { ...mockChallenge, description: null };
    const { getByText } = renderWithProviders(
      <ChallengeListItem
        challenge={challengeWithoutDesc}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });
});
