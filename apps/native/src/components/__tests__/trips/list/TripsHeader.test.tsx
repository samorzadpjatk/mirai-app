import { screen } from "@testing-library/react-native";
import { TripsHeader } from "../../../trips/list/TripsHeader";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("TripsHeader", () => {
  it("should render with title and subtitle", () => {
    renderWithProviders(<TripsHeader title="Your Trips" subtitle="Manage and view your trips" />);

    expect(screen.getByText("Your Trips")).toBeOnTheScreen();
    expect(screen.getByText("Manage and view your trips")).toBeOnTheScreen();
  });

  it("should render with custom title", () => {
    renderWithProviders(
      <TripsHeader title="Available Trips" subtitle="Browse all available trips" />,
    );

    expect(screen.getByText("Available Trips")).toBeOnTheScreen();
  });

  it("should render with custom subtitle", () => {
    renderWithProviders(<TripsHeader title="Trips" subtitle="Explore upcoming adventures" />);

    expect(screen.getByText("Explore upcoming adventures")).toBeOnTheScreen();
  });

  it("should render header container", () => {
    renderWithProviders(<TripsHeader title="Header Title" subtitle="Header Subtitle" />);

    expect(screen.getByText("Header Title")).toBeOnTheScreen();
    expect(screen.getByText("Header Subtitle")).toBeOnTheScreen();
  });
});
