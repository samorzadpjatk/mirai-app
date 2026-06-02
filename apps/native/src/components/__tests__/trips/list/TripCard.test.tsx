import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripCard } from "../../../trips/list/TripCard";
import type { TripListItem } from "../../../trips/list/types";

const noop = (): void => void 0;

jest.mock("~/hooks/trips/useTripBackgroundImageDownload", () => ({
  useTripBackgroundImageDownload: () => ({ imageUrl: null }),
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

const mockTrip: TripListItem = {
  id: "1",
  name: "Summer Adventure",
  description: "An amazing summer trip",
  startDate: new Date("2024-07-01"),
  endDate: new Date("2024-07-07"),
  groups: [{ id: "g1" }, { id: "g2" }],
  backgroundImagePath: null,
};

const mockPastTrip: TripListItem = {
  id: "2",
  name: "Winter Retreat",
  description: "A cozy winter getaway",
  startDate: new Date("2023-12-01"),
  endDate: new Date("2023-12-05"),
  groups: [{ id: "g1" }],
  backgroundImagePath: null,
};

const mockFutureTrip: TripListItem = {
  id: "3",
  name: "Spring Festival",
  description: "Upcoming spring celebration",
  startDate: new Date(Date.now() + 86400000 * 30),
  endDate: new Date(Date.now() + 86400000 * 35),
  groups: [],
  backgroundImagePath: null,
};

describe("TripCard", () => {
  it("should render trip name", () => {
    renderWithProviders(<TripCard trip={mockTrip} onPress={noop} />);

    expect(screen.getByText("Summer Adventure")).toBeOnTheScreen();
  });

  it("should render trip description", () => {
    renderWithProviders(<TripCard trip={mockTrip} onPress={noop} />);

    expect(screen.getByText("An amazing summer trip")).toBeOnTheScreen();
  });

  it("should render trip dates", () => {
    renderWithProviders(<TripCard trip={mockTrip} onPress={noop} />);

    expect(screen.getByText(/Jul 1, 2024/)).toBeOnTheScreen();
    expect(screen.getByText(/Jul 7, 2024/)).toBeOnTheScreen();
  });

  it("should display correct status for ongoing trip", () => {
    const ongoingTrip = {
      ...mockTrip,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
    };

    renderWithProviders(<TripCard trip={ongoingTrip} onPress={noop} />);

    expect(screen.getByText("Ongoing")).toBeOnTheScreen();
  });

  it("should display correct status for past trip", () => {
    renderWithProviders(<TripCard trip={mockPastTrip} onPress={noop} />);

    expect(screen.getByText("Past")).toBeOnTheScreen();
  });

  it("should display correct status for upcoming trip", () => {
    renderWithProviders(<TripCard trip={mockFutureTrip} onPress={noop} />);

    expect(screen.getByText("Upcoming")).toBeOnTheScreen();
  });

  it("should display group count", () => {
    renderWithProviders(<TripCard trip={mockTrip} onPress={noop} />);

    expect(screen.getByText("2 groups")).toBeOnTheScreen();
  });

  it("should display singular group text when only one group", () => {
    renderWithProviders(<TripCard trip={mockPastTrip} onPress={noop} />);

    expect(screen.getByText("1 group")).toBeOnTheScreen();
  });

  it("should call onPress when card is pressed", () => {
    const onPress = jest.fn();
    renderWithProviders(<TripCard trip={mockTrip} onPress={onPress} />);

    fireEvent.press(screen.getByText("Summer Adventure"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should not render description when not provided", () => {
    const tripWithoutDescription = { ...mockTrip, description: undefined };
    renderWithProviders(<TripCard trip={tripWithoutDescription} onPress={noop} />);

    expect(screen.queryByText("An amazing summer trip")).toBeNull();
  });

  it("should not render groups text when no groups", () => {
    renderWithProviders(<TripCard trip={mockFutureTrip} onPress={noop} />);

    expect(screen.queryByText(/group/)).toBeNull();
  });
});
