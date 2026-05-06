import React from "react";
import { Text } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { TripBanner } from "../../trips/TripBanner";

const mockUseTripStore = jest.fn();

jest.mock("~/stores/tripStore", () => ({
  useTripStore: (): ReturnType<typeof mockUseTripStore> => mockUseTripStore(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name }: { name: string; size: number; color: string }) {
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

describe("TripBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when no trip selected", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: null,
      isTripPast: false,
    });

    const { queryByText, queryByTestId } = renderWithProviders(<TripBanner />);

    expect(queryByText("This trip has ended — view only")).toBeNull();
    expect(queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("returns null when trip is not past", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-123",
      isTripPast: false,
    });

    const { queryByText, queryByTestId } = renderWithProviders(<TripBanner />);

    expect(queryByText("This trip has ended — view only")).toBeNull();
    expect(queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("returns null when selectedTripId is undefined", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: undefined,
      isTripPast: true,
    });

    const { queryByText, queryByTestId } = renderWithProviders(<TripBanner />);

    expect(queryByText("This trip has ended — view only")).toBeNull();
    expect(queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("renders TripEndedBanner when trip is selected and past", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-123",
      isTripPast: true,
    });

    const { getByText, getByTestId } = renderWithProviders(<TripBanner />);

    expect(getByText("This trip has ended — view only")).toBeTruthy();
    expect(getByTestId("icon-information-circle-outline")).toBeTruthy();
  });

  it("renders TripEndedBanner with correct visible prop", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-456",
      isTripPast: true,
    });

    const { getByText, getByTestId } = renderWithProviders(<TripBanner />);

    expect(getByText("This trip has ended — view only")).toBeTruthy();
    expect(getByTestId("icon-information-circle-outline")).toBeTruthy();
  });

  it("handles edge case when isTripPast is undefined", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-123",
      isTripPast: undefined,
    });

    const { queryByText, queryByTestId } = renderWithProviders(<TripBanner />);

    expect(queryByText("This trip has ended — view only")).toBeNull();
    expect(queryByTestId("icon-information-circle-outline")).toBeNull();
  });
});
