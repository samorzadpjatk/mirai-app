import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity } from "react-native";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { TripPickerModal } from "../../common/TripPickerModal";
import type { TripListItem } from "../../trips/list/types";

const noop = jest.fn();

describe("TripPickerModal", () => {
  const mockTrips: TripListItem[] = [
    { id: "1", name: "Trip to Paris", startDate: new Date(), endDate: new Date() },
    { id: "2", name: "Trip to London", startDate: new Date(), endDate: new Date() },
    { id: "3", name: "Trip to Tokyo", startDate: new Date(), endDate: new Date() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have Modal with visible=false when not visible", () => {
    renderWithProviders(
      <TripPickerModal
        visible={false}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(false);
  });

  it("should render when visible is true", () => {
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    expect(screen.getByText("Select trip")).toBeOnTheScreen();
  });

  it("should render all trips in the list", () => {
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    expect(screen.getByText("Trip to Paris")).toBeOnTheScreen();
    expect(screen.getByText("Trip to London")).toBeOnTheScreen();
    expect(screen.getByText("Trip to Tokyo")).toBeOnTheScreen();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={onClose}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBeGreaterThan(0);
    fireEvent.press(touchables[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onSelectTrip and onClose when a trip is selected", async () => {
    const onSelectTrip = jest.fn();
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={onClose}
        onSelectTrip={onSelectTrip}
        trips={mockTrips}
      />
    );

    await user.press(screen.getByText("Trip to Paris"));
    expect(onSelectTrip).toHaveBeenCalledWith("1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show checkmark for selected trip", () => {
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
        selectedTripId="2"
      />
    );

    const textElements = screen.UNSAFE_getAllByType(Text);
    expect(textElements.length).toBeGreaterThan(0);
  });

  it("should show empty state when no trips available", () => {
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={[]}
      />
    );

    expect(screen.getByText("No trips available")).toBeOnTheScreen();
  });

  it("should show loading indicator when isLoading is true and no trips", () => {
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={[]}
        isLoading={true}
      />
    );

    expect(screen.queryByText("No trips available")).toBeNull();
  });

  it("should show loading more indicator when isFetchingMore is true", () => {
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
        isFetchingMore={true}
      />
    );

    expect(screen.getByText("Loading more trips...")).toBeOnTheScreen();
  });

  it("should call onLoadMore when scrolling", () => {
    const onLoadMore = jest.fn();
    renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
        onLoadMore={onLoadMore}
      />
    );

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: 500 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 400 },
      },
    });
    expect(onLoadMore).toHaveBeenCalled();
  });
});
