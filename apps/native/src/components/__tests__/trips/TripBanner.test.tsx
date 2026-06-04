import { screen } from "@testing-library/react-native";
import { Text as mockText } from "react-native";
import { TripBanner } from "../../trips/TripBanner";
import { renderWithProviders } from "../helpers/renderWithProviders";

const mockUseTripStore = jest.fn();

jest.mock("~/stores/tripStore", () => ({
  useTripStore: (): ReturnType<typeof mockUseTripStore> => mockUseTripStore(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name }: { name: string; size: number; color: string }) {
    const { View, Text } = jest.requireActual("react-native");
    return (
      <View testID={`icon-${name}`}>
        <Text>{name}</Text>
      </View>
    );
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

    renderWithProviders(<TripBanner />);

    expect(screen.queryByText("This trip has ended — view only")).toBeNull();
    expect(screen.queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("returns null when trip is not past", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-123",
      isTripPast: false,
    });

    renderWithProviders(<TripBanner />);

    expect(screen.queryByText("This trip has ended — view only")).toBeNull();
    expect(screen.queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("returns null when selectedTripId is undefined", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: undefined,
      isTripPast: true,
    });

    renderWithProviders(<TripBanner />);

    expect(screen.queryByText("This trip has ended — view only")).toBeNull();
    expect(screen.queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("renders TripEndedBanner when trip is selected and past", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-123",
      isTripPast: true,
    });

    renderWithProviders(<TripBanner />);

    expect(screen.getByText("This trip has ended — view only")).toBeOnTheScreen();
    expect(screen.getByTestId("icon-information-circle-outline")).toBeOnTheScreen();
  });

  it("renders TripEndedBanner with correct visible prop", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-456",
      isTripPast: true,
    });

    renderWithProviders(<TripBanner />);

    expect(screen.getByText("This trip has ended — view only")).toBeOnTheScreen();
    expect(screen.getByTestId("icon-information-circle-outline")).toBeOnTheScreen();
  });

  it("handles edge case when isTripPast is undefined", () => {
    mockUseTripStore.mockReturnValue({
      selectedTripId: "trip-123",
      isTripPast: undefined,
    });

    renderWithProviders(<TripBanner />);

    expect(screen.queryByText("This trip has ended — view only")).toBeNull();
    expect(screen.queryByTestId("icon-information-circle-outline")).toBeNull();
  });
});
