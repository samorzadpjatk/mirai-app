import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";

type ResponseListener = (response: unknown) => void;

const mockRemove = jest.fn();
const mockAddResponseListener = jest.fn((_listener: ResponseListener) => ({ remove: mockRemove }));
const mockGetLastResponse = jest.fn(async (): Promise<unknown> => null);
const mockPush = jest.fn();

jest.mock("expo-notifications", () => ({
  addNotificationResponseReceivedListener: (listener: ResponseListener) =>
    mockAddResponseListener(listener),
  getLastNotificationResponseAsync: () => mockGetLastResponse(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const {
  resolveNotificationRoute,
  useNotificationResponse,
} = require("../../notifications/useNotificationResponse");

function buildResponse(data: unknown) {
  return { notification: { request: { content: { data } } } };
}

describe("resolveNotificationRoute", () => {
  it("returns an in-app path unchanged", () => {
    expect(resolveNotificationRoute({ url: "/trips/leaderboard" })).toBe("/trips/leaderboard");
  });

  it("rewrites routes that never existed in the app", () => {
    // Every notification created by NotificationService used to point here.
    expect(resolveNotificationRoute({ url: "/ranking" })).toBe("/trips/leaderboard");
    expect(resolveNotificationRoute({ url: "/group/my" })).toBe("/trips/groups");
  });

  it("strips the server-side audience params", () => {
    expect(resolveNotificationRoute({ url: "/alerts?__audience=group&__groupId=g1" })).toBe(
      "/alerts",
    );
  });

  it("keeps genuine query params and the hash", () => {
    expect(resolveNotificationRoute({ url: "/alerts?__audience=all&tab=new#top" })).toBe(
      "/alerts?tab=new#top",
    );
  });

  it("rejects anything that is not an in-app absolute path", () => {
    expect(resolveNotificationRoute({ url: "https://evil.example.com" })).toBeNull();
    expect(resolveNotificationRoute({ url: "//evil.example.com" })).toBeNull();
    expect(resolveNotificationRoute({ url: "javascript:alert(1)" })).toBeNull();
    expect(resolveNotificationRoute({ url: "trips/leaderboard" })).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(resolveNotificationRoute(null)).toBeNull();
    expect(resolveNotificationRoute(undefined)).toBeNull();
    expect(resolveNotificationRoute({})).toBeNull();
    expect(resolveNotificationRoute({ url: 42 })).toBeNull();
    expect(resolveNotificationRoute({ url: "   " })).toBeNull();
  });
});

describe("useNotificationResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLastResponse.mockResolvedValue(null);
  });

  it("registers a response listener", () => {
    renderHook(() => useNotificationResponse());
    expect(mockAddResponseListener).toHaveBeenCalledTimes(1);
  });

  it("navigates when a notification is tapped", async () => {
    renderHook(() => useNotificationResponse());

    const listener = mockAddResponseListener.mock.calls[0]?.[0] as ResponseListener;
    listener(buildResponse({ url: "/trips/rewards" }));

    expect(mockPush).toHaveBeenCalledWith("/trips/rewards");
  });

  it("does not navigate for an unusable payload", async () => {
    renderHook(() => useNotificationResponse());

    const listener = mockAddResponseListener.mock.calls[0]?.[0] as ResponseListener;
    listener(buildResponse({ url: "https://evil.example.com" }));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handles the response that cold-started the app", async () => {
    mockGetLastResponse.mockResolvedValue(buildResponse({ url: "/ranking" }));

    renderHook(() => useNotificationResponse());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trips/leaderboard");
    });
  });

  it("removes the listener on unmount", () => {
    const { unmount } = renderHook(() => useNotificationResponse());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
