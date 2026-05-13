import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
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
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} />);

    expect(screen.getByText("Groups")).toBeOnTheScreen();
    expect(screen.getByText("Map")).toBeOnTheScreen();
    expect(screen.getByText("Challenges")).toBeOnTheScreen();
    expect(screen.getByText("Rewards")).toBeOnTheScreen();
    expect(screen.getByText("Leaderboard")).toBeOnTheScreen();
    expect(screen.getByText("Trip Info")).toBeOnTheScreen();
  });

  it("should render all subtitles", () => {
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} />);

    expect(screen.getByText("Team Roster")).toBeOnTheScreen();
    expect(screen.getByText("Trip Locations")).toBeOnTheScreen();
    expect(screen.getByText("Daily Quests")).toBeOnTheScreen();
    expect(screen.getByText("Prize Store")).toBeOnTheScreen();
    expect(screen.getByText("Quest Rankings")).toBeOnTheScreen();
    expect(screen.getByText("Schedules & Rules")).toBeOnTheScreen();
  });

  it("should call onOpenGroups when Groups card is pressed", () => {
    const onOpenGroups = jest.fn();
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} onOpenGroups={onOpenGroups} />);

    fireEvent.press(screen.getByText("Groups"));
    expect(onOpenGroups).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenMap when Map card is pressed", () => {
    const onOpenMap = jest.fn();
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} onOpenMap={onOpenMap} />);

    fireEvent.press(screen.getByText("Map"));
    expect(onOpenMap).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenChallenges when Challenges card is pressed", () => {
    const onOpenChallenges = jest.fn();
    renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenChallenges={onOpenChallenges} />,
    );

    fireEvent.press(screen.getByText("Challenges"));
    expect(onOpenChallenges).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenLeaderboard when Leaderboard card is pressed", () => {
    const onOpenLeaderboard = jest.fn();
    renderWithProviders(
      <TripQuickAccessGrid {...defaultProps} onOpenLeaderboard={onOpenLeaderboard} />,
    );

    fireEvent.press(screen.getByText("Leaderboard"));
    expect(onOpenLeaderboard).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenRewards when Rewards card is pressed", () => {
    const onOpenRewards = jest.fn();
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} onOpenRewards={onOpenRewards} />);

    fireEvent.press(screen.getByText("Rewards"));
    expect(onOpenRewards).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenInfo when Trip Info card is pressed", () => {
    const onOpenInfo = jest.fn();
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} onOpenInfo={onOpenInfo} />);

    fireEvent.press(screen.getByText("Trip Info"));
    expect(onOpenInfo).toHaveBeenCalledTimes(1);
  });

  it("should not render Map card when trip is past", () => {
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} isTripPast={true} />);

    expect(screen.queryByText("Map")).toBeNull();
    expect(screen.queryByText("Trip Locations")).toBeNull();
  });

  it("should render Map card when trip is not past", () => {
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} isTripPast={false} />);

    expect(screen.getByText("Map")).toBeOnTheScreen();
    expect(screen.getByText("Trip Locations")).toBeOnTheScreen();
  });

  it("should render Map card when isTripPast is undefined", () => {
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} />);

    expect(screen.getByText("Map")).toBeOnTheScreen();
  });

  it("should render all other cards when trip is past", () => {
    renderWithProviders(<TripQuickAccessGrid {...defaultProps} isTripPast={true} />);

    expect(screen.getByText("Groups")).toBeOnTheScreen();
    expect(screen.getByText("Challenges")).toBeOnTheScreen();
    expect(screen.getByText("Rewards")).toBeOnTheScreen();
    expect(screen.getByText("Leaderboard")).toBeOnTheScreen();
    expect(screen.getByText("Trip Info")).toBeOnTheScreen();
  });
});
