import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithMSW } from "../../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../../test-utils/msw/server";
import { TripNewsSection } from "../../../trips/details/TripNewsSection";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("TripNewsSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
    server.resetHandlers();
  });

  it("should render loading state", async () => {
    server.use(
      createORPCHandler(
        ["activityFeed", "getByTrip"],
        () =>
          new Promise(() => {
            /* intentionally never resolves */
          }),
      ),
    );
    const { getByText } = renderWithMSW(<TripNewsSection tripId="trip-1" />);
    await waitFor(() => expect(getByText("Loading admin news...")).toBeTruthy());
  });

  it("should render empty state", async () => {
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => ({ activities: [] })));
    const { getByText } = renderWithMSW(<TripNewsSection tripId="trip-1" />);
    await waitFor(() => expect(getByText("No news yet.")).toBeTruthy());
  });

  it("should render news items", async () => {
    server.use(
      createORPCHandler(["activityFeed", "getByTrip"], () => ({
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
      })),
    );
    const { getByText } = renderWithMSW(<TripNewsSection tripId="trip-1" />);
    await waitFor(() => expect(getByText("Test News")).toBeTruthy());
    await waitFor(() => expect(getByText("Added by John Doe")).toBeTruthy());
  });

  it("should navigate to community when View all pressed", async () => {
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => ({ activities: [] })));
    const { getByText } = renderWithMSW(<TripNewsSection tripId="trip-1" />);
    await waitFor(() => expect(getByText("No news yet.")).toBeTruthy());
    fireEvent.press(getByText("View all"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/community",
      params: { filter: "news" },
    });
  });

  it("should navigate to community with focus when news item pressed", async () => {
    server.use(
      createORPCHandler(["activityFeed", "getByTrip"], () => ({
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
      })),
    );
    const { getByText } = renderWithMSW(<TripNewsSection tripId="trip-1" />);
    await waitFor(() => expect(getByText("Test News")).toBeTruthy());
    fireEvent.press(getByText("Test News"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/community",
      params: { filter: "news", focusActivityId: "news-1" },
    });
  });
});
