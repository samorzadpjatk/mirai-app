import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripCard } from "../../../trips/list/TripCard";
import type { TripListItem } from "../../../trips/list/types";

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
    const { getByText } = renderWithProviders(
      <TripCard trip={mockTrip} onPress={() => {}} />
    );

    expect(getByText("Summer Adventure")).toBeTruthy();
  });

  it("should render trip description", () => {
    const { getByText } = renderWithProviders(
      <TripCard trip={mockTrip} onPress={() => {}} />
    );

    expect(getByText("An amazing summer trip")).toBeTruthy();
  });

  it("should render trip dates", () => {
    const { getByText } = renderWithProviders(
      <TripCard trip={mockTrip} onPress={() => {}} />
    );

    expect(getByText(/Jul 1, 2024/)).toBeTruthy();
    expect(getByText(/Jul 7, 2024/)).toBeTruthy();
  });

  it("should display correct status for ongoing trip", () => {
    const ongoingTrip = {
      ...mockTrip,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
    };

    const { getByText } = renderWithProviders(
      <TripCard trip={ongoingTrip} onPress={() => {}} />
    );

    expect(getByText("Ongoing")).toBeTruthy();
  });

  it("should display correct status for past trip", () => {
    const { getByText } = renderWithProviders(
      <TripCard trip={mockPastTrip} onPress={() => {}} />
    );

    expect(getByText("Past")).toBeTruthy();
  });

  it("should display correct status for upcoming trip", () => {
    const { getByText } = renderWithProviders(
      <TripCard trip={mockFutureTrip} onPress={() => {}} />
    );

    expect(getByText("Upcoming")).toBeTruthy();
  });

  it("should display group count", () => {
    const { getByText } = renderWithProviders(
      <TripCard trip={mockTrip} onPress={() => {}} />
    );

    expect(getByText("2 groups")).toBeTruthy();
  });

  it("should display singular group text when only one group", () => {
    const { getByText } = renderWithProviders(
      <TripCard trip={mockPastTrip} onPress={() => {}} />
    );

    expect(getByText("1 group")).toBeTruthy();
  });

  it("should call onPress when card is pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <TripCard trip={mockTrip} onPress={onPress} />
    );

    fireEvent.press(getByText("Summer Adventure"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should not render description when not provided", () => {
    const tripWithoutDescription = { ...mockTrip, description: undefined };
    const { queryByText } = renderWithProviders(
      <TripCard trip={tripWithoutDescription} onPress={() => {}} />
    );

    expect(queryByText("An amazing summer trip")).toBeNull();
  });

  it("should not render groups text when no groups", () => {
    const { queryByText } = renderWithProviders(
      <TripCard trip={mockFutureTrip} onPress={() => {}} />
    );

    expect(queryByText(/group/)).toBeNull();
  });
});
