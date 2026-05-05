import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripsEmptyState } from "../../../trips/list/TripsEmptyState";

describe("TripsEmptyState", () => {
  it("should render with title and subtitle", () => {
    const { getByText } = renderWithProviders(
      <TripsEmptyState
        title="No Trips Available"
        subtitle="Check back later for upcoming trips"
      />
    );

    expect(getByText("No Trips Available")).toBeTruthy();
    expect(getByText("Check back later for upcoming trips")).toBeTruthy();
  });

  it("should render with custom title", () => {
    const { getByText } = renderWithProviders(
      <TripsEmptyState
        title="All Trips Completed"
        subtitle="You've participated in all trips"
      />
    );

    expect(getByText("All Trips Completed")).toBeTruthy();
  });

  it("should render with custom subtitle", () => {
    const { getByText } = renderWithProviders(
      <TripsEmptyState
        title="No Active Trips"
        subtitle="There are no trips happening right now"
      />
    );

    expect(getByText("There are no trips happening right now")).toBeTruthy();
  });

  it("should render empty state container", () => {
    const { getByText } = renderWithProviders(
      <TripsEmptyState
        title="Empty Title"
        subtitle="Empty Subtitle"
      />
    );

    expect(getByText("Empty Title")).toBeTruthy();
    expect(getByText("Empty Subtitle")).toBeTruthy();
  });
});
