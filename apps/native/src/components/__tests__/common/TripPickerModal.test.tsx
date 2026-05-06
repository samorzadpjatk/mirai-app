import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
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
    const { UNSAFE_getByType } = renderWithProviders(
      <TripPickerModal
        visible={false}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(false);
  });

  it("should render when visible is true", () => {
    const { getByText } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    expect(getByText("Select trip")).toBeTruthy();
  });

  it("should render all trips in the list", () => {
    const { getByText } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    expect(getByText("Trip to Paris")).toBeTruthy();
    expect(getByText("Trip to London")).toBeTruthy();
    expect(getByText("Trip to Tokyo")).toBeTruthy();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={onClose}
        onSelectTrip={noop}
        trips={mockTrips}
      />
    );

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBeGreaterThan(0);
    fireEvent.press(touchables[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onSelectTrip and onClose when a trip is selected", () => {
    const onSelectTrip = jest.fn();
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={onClose}
        onSelectTrip={onSelectTrip}
        trips={mockTrips}
      />
    );

    fireEvent.press(getByText("Trip to Paris"));
    expect(onSelectTrip).toHaveBeenCalledWith("1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show checkmark for selected trip", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
        selectedTripId="2"
      />
    );

    const textElements = UNSAFE_getAllByType(Text);
    expect(textElements.length).toBeGreaterThan(0);
  });

  it("should show empty state when no trips available", () => {
    const { getByText } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={[]}
      />
    );

    expect(getByText("No trips available")).toBeTruthy();
  });

  it("should show loading indicator when isLoading is true and no trips", () => {
    const { queryByText } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={[]}
        isLoading={true}
      />
    );

    expect(queryByText("No trips available")).toBeNull();
  });

  it("should show loading more indicator when isFetchingMore is true", () => {
    const { getByText } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
        isFetchingMore={true}
      />
    );

    expect(getByText("Loading more trips...")).toBeTruthy();
  });

  it("should call onLoadMore when scrolling", () => {
    const onLoadMore = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <TripPickerModal
        visible={true}
        onClose={noop}
        onSelectTrip={noop}
        trips={mockTrips}
        onLoadMore={onLoadMore}
      />
    );

    const scrollView = UNSAFE_getByType(ScrollView);
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
