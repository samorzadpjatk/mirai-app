import React from "react";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripsEmptyState } from "../../../trips/list/TripsEmptyState";

describe("TripsEmptyState", () => {
  it("should render with title and subtitle", () => {
    renderWithProviders(
      <TripsEmptyState
        title="No Trips Available"
        subtitle="Check back later for upcoming trips"
      />
    );

    expect(screen.getByText("No Trips Available")).toBeOnTheScreen();
    expect(screen.getByText("Check back later for upcoming trips")).toBeOnTheScreen();
  });

  it("should render with custom title", () => {
    renderWithProviders(
      <TripsEmptyState
        title="All Trips Completed"
        subtitle="You've participated in all trips"
      />
    );

    expect(screen.getByText("All Trips Completed")).toBeOnTheScreen();
  });

  it("should render with custom subtitle", () => {
    renderWithProviders(
      <TripsEmptyState
        title="No Active Trips"
        subtitle="There are no trips happening right now"
      />
    );

    expect(screen.getByText("There are no trips happening right now")).toBeOnTheScreen();
  });

  it("should render empty state container", () => {
    renderWithProviders(
      <TripsEmptyState
        title="Empty Title"
        subtitle="Empty Subtitle"
      />
    );

    expect(screen.getByText("Empty Title")).toBeOnTheScreen();
    expect(screen.getByText("Empty Subtitle")).toBeOnTheScreen();
  });
});
