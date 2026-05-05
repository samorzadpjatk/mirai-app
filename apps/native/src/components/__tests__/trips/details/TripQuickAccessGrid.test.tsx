import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripQuickAccessGrid } from "../../../trips/details/TripQuickAccessGrid";

describe("TripQuickAccessGrid", () => {
  const defaultProps = {
    onOpenGroups: jest.fn(),
    onOpenMap: jest.fn(),
    onOpenChallenges: jest.fn(),
    onOpenLeaderboard: jest.fn(),
    onOpenRewards: jest.fn(),
    onOpenInfo: jest.fn(),
  };

  it("should render all action cards", () => {
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} />
    );

    expect(getByText("Groups")).toBeTruthy();
    expect(getByText("Map")).toBeTruthy();
    expect(getByText("Challenges")).toBeTruthy();
    expect(getByText("Rewards")).toBeTruthy();
    expect(getByText("Leaderboard")).toBeTruthy();
    expect(getByText("Trip Info")).toBeTruthy();
  });

  it("should render all subtitles", () => {
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} />
    );

    expect(getByText("Team Roster")).toBeTruthy();
    expect(getByText("Trip Locations")).toBeTruthy();
    expect(getByText("Daily Quests")).toBeTruthy();
    expect(getByText("Prize Store")).toBeTruthy();
    expect(getByText("Quest Rankings")).toBeTruthy();
    expect(getByText("Schedules & Rules")).toBeTruthy();
  });

  it("should call onOpenGroups when Groups card is pressed", () => {
    const onOpenGroups = jest.fn();
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenGroups={onOpenGroups} />
    );

    fireEvent.press(getByText("Groups"));
    expect(onOpenGroups).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenMap when Map card is pressed", () => {
    const onOpenMap = jest.fn();
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenMap={onOpenMap} />
    );

    fireEvent.press(getByText("Map"));
    expect(onOpenMap).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenChallenges when Challenges card is pressed", () => {
    const onOpenChallenges = jest.fn();
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenChallenges={onOpenChallenges} />
    );

    fireEvent.press(getByText("Challenges"));
    expect(onOpenChallenges).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenLeaderboard when Leaderboard card is pressed", () => {
    const onOpenLeaderboard = jest.fn();
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenLeaderboard={onOpenLeaderboard} />
    );

    fireEvent.press(getByText("Leaderboard"));
    expect(onOpenLeaderboard).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenRewards when Rewards card is pressed", () => {
    const onOpenRewards = jest.fn();
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenRewards={onOpenRewards} />
    );

    fireEvent.press(getByText("Rewards"));
    expect(onOpenRewards).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenInfo when Trip Info card is pressed", () => {
    const onOpenInfo = jest.fn();
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenInfo={onOpenInfo} />
    );

    fireEvent.press(getByText("Trip Info"));
    expect(onOpenInfo).toHaveBeenCalledTimes(1);
  });

  it("should not render Map card when trip is past", () => {
    const { queryByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} isTripPast={true} />
    );

    expect(queryByText("Map")).toBeNull();
    expect(queryByText("Trip Locations")).toBeNull();
  });

  it("should render Map card when trip is not past", () => {
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} isTripPast={false} />
    );

    expect(getByText("Map")).toBeTruthy();
    expect(getByText("Trip Locations")).toBeTruthy();
  });

  it("should render Map card when isTripPast is undefined", () => {
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} />
    );

    expect(getByText("Map")).toBeTruthy();
  });

  it("should render all other cards when trip is past", () => {
    const { getByText } = renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} isTripPast={true} />
    );

    expect(getByText("Groups")).toBeTruthy();
    expect(getByText("Challenges")).toBeTruthy();
    expect(getByText("Rewards")).toBeTruthy();
    expect(getByText("Leaderboard")).toBeTruthy();
    expect(getByText("Trip Info")).toBeTruthy();
  });
});
