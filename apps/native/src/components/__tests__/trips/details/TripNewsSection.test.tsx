import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TripNewsSection } from "../../../trips/details/TripNewsSection";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    activityFeed: {
      getByTrip: {
        queryOptions: jest.fn(() => ({ queryKey: ["news", "trip-1"] })),
      },
    },
  },
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

const { useQuery } = require("@tanstack/react-query");

describe("TripNewsSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
    useQuery.mockReturnValue({
      data: { activities: [] },
      isLoading: false,
    });
  });

  it("should render loading state", () => {
    useQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { getByText } = renderWithProviders(<TripNewsSection tripId="trip-1" />);
    expect(getByText("Loading admin news...")).toBeTruthy();
  });

  it("should render empty state", () => {
    useQuery.mockReturnValue({
      data: { activities: [] },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<TripNewsSection tripId="trip-1" />);
    expect(getByText("No news yet.")).toBeTruthy();
  });

  it("should render news items", () => {
    useQuery.mockReturnValue({
      data: {
        activities: [
          {
            id: "news-1",
            activityType: "custom",
            title: "Test News",
            description: "Test description",
            imageUrl: null,
            createdAt: new Date().toISOString(),
            admin: { firstName: "John", lastName: "Doe" },
          },
        ],
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<TripNewsSection tripId="trip-1" />);
    expect(getByText("Test News")).toBeTruthy();
    expect(getByText("Added by John Doe")).toBeTruthy();
  });

  it("should navigate to community when View all pressed", () => {
    const { getByText } = renderWithProviders(<TripNewsSection tripId="trip-1" />);

    fireEvent.press(getByText("View all"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/community",
      params: { filter: "news" },
    });
  });

  it("should navigate to community with focus when news item pressed", () => {
    useQuery.mockReturnValue({
      data: {
        activities: [
          {
            id: "news-1",
            activityType: "custom",
            title: "Test News",
            description: null,
            imageUrl: null,
            createdAt: new Date().toISOString(),
            admin: { firstName: "John", lastName: "Doe" },
          },
        ],
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<TripNewsSection tripId="trip-1" />);

    fireEvent.press(getByText("Test News"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/community",
      params: { filter: "news", focusActivityId: "news-1" },
    });
  });
});
