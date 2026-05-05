import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminChallengeListCard } from "../../admin/challenges/AdminChallengeListCard";

describe("AdminChallengeListCard", () => {
  const mockChallenge = {
    id: "challenge-1",
    tripId: "trip-1",
    title: "Test Challenge",
    basePoints: 100,
    status: "ACTIVE",
    endTime: null,
    submissionType: "IMAGE" as const,
    scoringCategory: "JUDGED_STAFF" as const,
    participantGroupsCount: 5,
    pendingSubmissionsCount: 2,
    autoApprove: false,
  };

  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders challenge title", () => {
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("renders challenge points", () => {
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("100 PTS")).toBeTruthy();
  });

  it("renders challenge status", () => {
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("ACTIVE")).toBeTruthy();
  });

  it("renders participant count", () => {
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("5")).toBeTruthy();
  });

  it("renders pending submissions count", () => {
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("2")).toBeTruthy();
  });

  it("calls onDelete when delete button is pressed", () => {
    const { getAllByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={mockChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    const deleteButtons = getAllByText("trash");
    fireEvent.press(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledWith(mockChallenge.id);
  });

  it("renders with different status", () => {
    const hiddenChallenge = { ...mockChallenge, status: "HIDDEN" };
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={hiddenChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("HIDDEN")).toBeTruthy();
  });

  it("renders with different point values", () => {
    const highPointChallenge = { ...mockChallenge, basePoints: 250 };
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={highPointChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("250 PTS")).toBeTruthy();
  });

  it("renders with SPEED scoring category", () => {
    const speedChallenge = { ...mockChallenge, scoringCategory: "SPEED" as const };
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={speedChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("renders with VIDEO submission type", () => {
    const videoChallenge = { ...mockChallenge, submissionType: "VIDEO" as const };
    const { getByText } = renderWithProviders(
      <AdminChallengeListCard
        challenge={videoChallenge}
        onDelete={mockOnDelete}
        tripId="trip-1"
      />
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });
});
