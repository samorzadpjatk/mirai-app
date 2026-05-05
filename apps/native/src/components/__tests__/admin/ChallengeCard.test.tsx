import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ChallengeCard from "../../admin/challenges/ChallengeCard";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

describe("Admin ChallengeCard", () => {
  const baseChallenge = {
    id: "challenge-1",
    tripId: "trip-1",
    title: "Test Challenge",
    description: "Test description",
    points: 100,
    icon: "star",
    category: "standard" as const,
    status: "active" as const,
  };

  it("renders challenge data", () => {
    const { getByText } = renderWithProviders(<ChallengeCard challenge={baseChallenge as any} />);
    expect(getByText("Test Challenge")).toBeTruthy();
    expect(getByText("100 PTS")).toBeTruthy();
    expect(getByText(/Campus/)).toBeTruthy();
    expect(getByText("star")).toBeTruthy();
  });

  it("shows draft label", () => {
    const draft = { ...baseChallenge, status: "draft" as const };
    const { getByText } = renderWithProviders(<ChallengeCard challenge={draft as any} />);
    expect(getByText(/DRAFT/)).toBeTruthy();
  });

  it("maps special icons", () => {
    const wintegral = { ...baseChallenge, category: "wintegral" as const, icon: "eco" };
    const { getByText } = renderWithProviders(<ChallengeCard challenge={wintegral as any} />);
    expect(getByText("leaf")).toBeTruthy();
    expect(getByText(/Trip/)).toBeTruthy();
  });

  it("calls edit and delete handlers", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(<ChallengeCard challenge={baseChallenge as any} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.press(getByText("create"));
    fireEvent.press(getByText("trash"));
    expect(onEdit).toHaveBeenCalledWith(baseChallenge);
    expect(onDelete).toHaveBeenCalledWith("challenge-1", "trip-1");
  });
});
