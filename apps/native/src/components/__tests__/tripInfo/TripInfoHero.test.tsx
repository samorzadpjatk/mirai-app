import { screen } from "@testing-library/react-native";
import { TripInfoHero } from "../../tripInfo/TripInfoHero";
import { renderWithProviders } from "../helpers/renderWithProviders";

describe("TripInfoHero", () => {
  it("should render the title", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" />);

    expect(screen.getByTestId("trip-info-hero-title")).toHaveTextContent("Integral 2026");
  });

  it("should render the date range when provided", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" subtitle="Sep 16 - Sep 20, 2026" />);

    expect(screen.getByTestId("trip-info-hero-subtitle")).toHaveTextContent(
      "Sep 16 - Sep 20, 2026",
    );
  });

  it("should not render a subtitle when the trip dates are unknown", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" subtitle={null} />);

    expect(screen.queryByTestId("trip-info-hero-subtitle")).toBeNull();
  });

  it("should never show template copy such as a hardcoded date range", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" />);

    expect(screen.queryByText("Feb 20 - Mar 01, 2026")).toBeNull();
    expect(screen.queryByText("Live Now")).toBeNull();
  });

  it("should render the status badge when provided", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" badge="Upcoming" />);

    expect(screen.getByTestId("trip-info-hero-badge")).toHaveTextContent("Upcoming");
  });

  it("should not render a badge when the trip status is unknown", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" badge={null} />);

    expect(screen.queryByTestId("trip-info-hero-badge")).toBeNull();
  });

  it("should render the seeded hero image when one is downloaded", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" imageUri="file:///hero-bg.png" />);

    expect(screen.getByTestId("trip-info-hero-image")).toBeOnTheScreen();
  });

  it("should fall back to a plain card instead of a remote stock photo", () => {
    renderWithProviders(<TripInfoHero title="Integral 2026" />);

    expect(screen.getByTestId("trip-info-hero")).toBeOnTheScreen();
    expect(screen.queryByTestId("trip-info-hero-image")).toBeNull();
  });
});
