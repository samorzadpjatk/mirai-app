import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripsHeader } from "../../../trips/list/TripsHeader";

describe("TripsHeader", () => {
  it("should render with title and subtitle", () => {
    const { getByText } = renderWithProviders(
      <TripsHeader
        title="Your Trips"
        subtitle="Manage and view your trips"
      />
    );

    expect(getByText("Your Trips")).toBeTruthy();
    expect(getByText("Manage and view your trips")).toBeTruthy();
  });

  it("should render with custom title", () => {
    const { getByText } = renderWithProviders(
      <TripsHeader
        title="Available Trips"
        subtitle="Browse all available trips"
      />
    );

    expect(getByText("Available Trips")).toBeTruthy();
  });

  it("should render with custom subtitle", () => {
    const { getByText } = renderWithProviders(
      <TripsHeader
        title="Trips"
        subtitle="Explore upcoming adventures"
      />
    );

    expect(getByText("Explore upcoming adventures")).toBeTruthy();
  });

  it("should render header container", () => {
    const { getByText } = renderWithProviders(
      <TripsHeader
        title="Header Title"
        subtitle="Header Subtitle"
      />
    );

    expect(getByText("Header Title")).toBeTruthy();
    expect(getByText("Header Subtitle")).toBeTruthy();
  });
});
