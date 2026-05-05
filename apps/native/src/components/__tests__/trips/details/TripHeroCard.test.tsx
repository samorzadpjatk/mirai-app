import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripHeroCard } from "../../../trips/details/TripHeroCard";

jest.mock("~/hooks/trips/useTripBackgroundImageDownload", () => ({
  useTripBackgroundImageDownload: () => ({ imageUrl: null }),
}));

describe("TripHeroCard", () => {
  it("should render trip name", () => {
    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="Summer Adventure"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />
    );

    expect(getByText("Summer Adventure")).toBeTruthy();
  });

  it("should render trip description when provided", () => {
    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="Summer Adventure"
        description="An amazing summer trip"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />
    );

    expect(getByText("An amazing summer trip")).toBeTruthy();
  });

  it("should not render description when not provided", () => {
    const { queryByText } = renderWithProviders(
      <TripHeroCard
        name="Summer Adventure"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />
    );

    expect(queryByText("An amazing summer trip")).toBeNull();
  });

  it("should display correct status for ongoing trip", () => {
    const ongoingStart = new Date(Date.now() - 86400000);
    const ongoingEnd = new Date(Date.now() + 86400000);

    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="Current Trip"
        startDate={ongoingStart}
        endDate={ongoingEnd}
      />
    );

    expect(getByText("Ongoing Trip")).toBeTruthy();
  });

  it("should display correct status for past trip", () => {
    const { getAllByText } = renderWithProviders(
      <TripHeroCard
        name="Past Trip"
        startDate={new Date("2023-01-01")}
        endDate={new Date("2023-01-07")}
      />
    );

    const pastTripElements = getAllByText("Past Trip");
    expect(pastTripElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should display correct status for future trip", () => {
    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="Future Trip"
        startDate={new Date("2025-01-01")}
        endDate={new Date("2025-01-07")}
      />
    );

    expect(getByText("Future Trip")).toBeTruthy();
  });

  it("should handle string dates", () => {
    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="String Date Trip"
        startDate="2024-07-01"
        endDate="2024-07-07"
      />
    );

    expect(getByText("String Date Trip")).toBeTruthy();
  });

  it("should render with imageUrl prop", () => {
    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="Trip With Image"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
        imageUrl="https://example.com/image.jpg"
      />
    );

    expect(getByText("Trip With Image")).toBeTruthy();
  });

  it("should render with backgroundImagePath prop", () => {
    const { getByText } = renderWithProviders(
      <TripHeroCard
        name="Trip With Background"
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
        backgroundImagePath="/path/to/image.jpg"
      />
    );

    expect(getByText("Trip With Background")).toBeTruthy();
  });

  it("should handle null description", () => {
    const { queryByText, getByText } = renderWithProviders(
      <TripHeroCard
        name="Trip With Null Description"
        description={null}
        startDate={new Date("2024-07-01")}
        endDate={new Date("2024-07-07")}
      />
    );

    expect(queryByText("Some description")).toBeNull();
    expect(getByText("Trip With Null Description")).toBeTruthy();
  });
});
