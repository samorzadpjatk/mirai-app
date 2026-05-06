import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
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
  } as const;

  const mockOnDelete = jest.fn();
  const mockOnDeletePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders challenge title", () => {
    renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText("Test Challenge")).toBeTruthy();
  });

  it("renders challenge points", () => {
    renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText("100 PTS")).toBeTruthy();
  });

  it("renders challenge status", () => {
    renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText("active")).toBeTruthy();
  });

  it("renders challenge description", () => {
    renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText("Test description")).toBeTruthy();
  });

  it("calls onDeletePress when delete button is pressed", () => {
    renderWithProviders(
      <ChallengeListItem
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    const deleteButtons = screen.getAllByText("trash");
    fireEvent.press(deleteButtons[0]);
    expect(mockOnDeletePress).toHaveBeenCalledWith(mockChallenge.id);
  });

  it("renders with different point values", () => {
    const highPointChallenge = { ...mockChallenge, basePoints: 500 };
    renderWithProviders(
      <ChallengeListItem
        challenge={highPointChallenge}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText("500 PTS")).toBeTruthy();
  });

  it("renders without description", () => {
    const challengeWithoutDesc = { ...mockChallenge, description: null };
    renderWithProviders(
      <ChallengeListItem
        challenge={challengeWithoutDesc}
        onDelete={mockOnDelete}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText("Test Challenge")).toBeTruthy();
  });
});
