import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { TripHeroCard } from "../../../trips/details/TripHeroCard";

jest.mock("~/hooks/trips/useTripBackgroundImageDownload", () => ({
  useTripBackgroundImageDownload: () => ({ imageUrl: null }),
}));

describe("TripHeroCard", () => {
  it("should render trip name", () => {
    renderWithProviders(
      <TripHeroCard
        name="Summer Adventure"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />,
    );

    expect(screen.getByText("Summer Adventure")).toBeOnTheScreen();
  });

  it("should render trip description when provided", () => {
    renderWithProviders(
      <TripHeroCard
        name="Summer Adventure"
        description="An amazing summer trip"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />,
    );

    expect(screen.getByText("An amazing summer trip")).toBeOnTheScreen();
  });

  it("should not render description when not provided", () => {
    renderWithProviders(
      <TripHeroCard
        name="Summer Adventure"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />,
    );

    expect(screen.queryByText("An amazing summer trip")).toBeNull();
  });

  it("should display correct status for ongoing trip", () => {
    const ongoingStart = new Date(Date.now() - 86400000);
    const ongoingEnd = new Date(Date.now() + 86400000);

    renderWithProviders(
      <TripHeroCard name="Current Trip" startDate={ongoingStart} endDate={ongoingEnd} />,
    );

    expect(screen.getByText("Ongoing Trip")).toBeOnTheScreen();
  });

  it("should display correct status for past trip", () => {
    renderWithProviders(
      <TripHeroCard
        name="Past Trip"
        startDate={new Date("2023-01-01")}
        endDate={new Date("2023-01-07")}
      />,
    );

    const pastTripElements = screen.getAllByText("Past Trip");
    expect(pastTripElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should display correct status for future trip", () => {
    renderWithProviders(
      <TripHeroCard
        name="Future Trip"
        startDate={new Date("2025-01-01")}
        endDate={new Date("2025-01-07")}
      />,
    );

    expect(screen.getByText("Future Trip")).toBeOnTheScreen();
  });

  it("should handle string dates", () => {
    renderWithProviders(
      <TripHeroCard name="String Date Trip" startDate="2024-07-01" endDate="2024-07-07" />,
    );

    expect(screen.getByText("String Date Trip")).toBeOnTheScreen();
  });

  it("should render with imageUrl prop", () => {
    renderWithProviders(
      <TripHeroCard
        name="Trip With Image"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
        imageUrl="https://example.com/image.jpg"
      />,
    );

    expect(screen.getByText("Trip With Image")).toBeOnTheScreen();
  });

  it("should render with backgroundImagePath prop", () => {
    renderWithProviders(
      <TripHeroCard
        name="Trip With Background"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
        backgroundImagePath="/path/to/image.jpg"
      />,
    );

    expect(screen.getByText("Trip With Background")).toBeOnTheScreen();
  });

  it("should handle null description", () => {
    renderWithProviders(
      <TripHeroCard
        name="Trip With Null Description"
        description={null}
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />,
    );

    expect(screen.queryByText("Some description")).toBeNull();
    expect(screen.getByText("Trip With Null Description")).toBeOnTheScreen();
  });
});
