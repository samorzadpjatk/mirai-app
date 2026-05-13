import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ChallengeCard from "../../admin/challenges/ChallengeCard";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

interface Challenge {
  id: string;
  tripId?: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  category: "standard" | "wintegral" | "special";
  status: string;
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  targetLatitude?: number | null;
  targetLongitude?: number | null;
}

describe("Admin ChallengeCard", () => {
  const baseChallenge: Challenge = {
    id: "challenge-1",
    tripId: "trip-1",
    title: "Test Challenge",
    description: "Test description",
    points: 100,
    icon: "star",
    category: "standard",
    status: "active",
    submissionType: "IMAGE",
    scoringCategory: "JUDGED_STAFF",
  };

  it("renders challenge data", () => {
    renderWithProviders(<ChallengeCard challenge={baseChallenge} />);
    expect(screen.getByText("Test Challenge")).toBeTruthy();
    expect(screen.getByText("100 PTS")).toBeTruthy();
    expect(screen.getByText(/Campus/)).toBeTruthy();
    expect(screen.getByText("star")).toBeTruthy();
  });

  it("shows draft label", () => {
    const draft: Challenge = { ...baseChallenge, status: "draft" };
    renderWithProviders(<ChallengeCard challenge={draft} />);
    expect(screen.getByText(/DRAFT/)).toBeTruthy();
  });

  it("maps special icons and displays category label for wintegral challenges", () => {
    const wintegral: Challenge = { ...baseChallenge, category: "wintegral", icon: "eco" };
    renderWithProviders(<ChallengeCard challenge={wintegral} />);
    expect(screen.getByText("leaf")).toBeTruthy();
    expect(screen.getByText(/Trip/)).toBeTruthy();
  });

  it("calls edit and delete handlers", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderWithProviders(
      <ChallengeCard challenge={baseChallenge} onEdit={onEdit} onDelete={onDelete} />,
    );
    fireEvent.press(screen.getByText("create"));
    fireEvent.press(screen.getByText("trash"));
    expect(onEdit).toHaveBeenCalledWith(baseChallenge);
    expect(onDelete).toHaveBeenCalledWith("challenge-1", "trip-1");
  });
});
