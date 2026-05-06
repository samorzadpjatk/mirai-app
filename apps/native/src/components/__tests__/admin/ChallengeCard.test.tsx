import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ChallengeCard from "../../admin/challenges/ChallengeCard";
import { Text } from "react-native";

interface IoniconsProps {
  name: string;
}

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: IoniconsProps) => React.createElement(Text, null, name),
}));

interface Challenge {
  id: string;
  tripId: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  category: "standard" | "wintegral" | "photo";
  status: "active" | "draft";
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
  };

  it("renders challenge data", () => {
    const { getByText } = renderWithProviders(<ChallengeCard challenge={baseChallenge} />);
    expect(getByText("Test Challenge")).toBeTruthy();
    expect(getByText("100 PTS")).toBeTruthy();
    expect(getByText(/Campus/)).toBeTruthy();
    expect(getByText("star")).toBeTruthy();
  });

  it("shows draft label", () => {
    const draft: Challenge = { ...baseChallenge, status: "draft" };
    const { getByText } = renderWithProviders(<ChallengeCard challenge={draft} />);
    expect(getByText(/DRAFT/)).toBeTruthy();
  });

  it("maps special icons", () => {
    const wintegral: Challenge = { ...baseChallenge, category: "wintegral", icon: "eco" };
    const { getByText } = renderWithProviders(<ChallengeCard challenge={wintegral} />);
    expect(getByText("leaf")).toBeTruthy();
    expect(getByText(/Trip/)).toBeTruthy();
  });

  it("calls edit and delete handlers", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(<ChallengeCard challenge={baseChallenge} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.press(getByText("create"));
    fireEvent.press(getByText("trash"));
    expect(onEdit).toHaveBeenCalledWith(baseChallenge);
    expect(onDelete).toHaveBeenCalledWith("challenge-1", "trip-1");
  });
});
