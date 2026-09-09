import { render, screen } from "@testing-library/react-native";

import CommunityScreen from "../community";

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    Redirect: ({ href }: { href: string }) =>
      React.createElement(View, {
        testID: "redirect-to-login",
        "data-href": href,
      }),
    // The screen refreshes the feed on focus; the real hook needs a navigation
    // container, so run the effect once on mount instead.
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(callback, [callback]);
    },
    useLocalSearchParams: jest.fn(() => ({})),
    useRouter: jest.fn(() => ({
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      setParams: jest.fn(),
    })),
  };
});

jest.mock("@mirai-app/auth/client", () => ({
  useAuth: jest.fn(() => ({
    session: null,
    isLoading: false,
    isAuthenticated: false,
    signInWithOtp: jest.fn(),
    signInWithPassword: jest.fn(),
    verifyOtp: jest.fn(),
    refreshSession: jest.fn(),
    signOut: jest.fn(),
    user: null,
  })),
}));

jest.mock("~/hooks/home", () => ({
  useHomeFull: jest.fn(() => ({
    trips: [],
    notifications: [],
    user: null,
    isLoading: false,
    isRefetching: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    isError: false,
    error: null,
  })),
}));

jest.mock("~/hooks/trips", () => ({
  useSelectedTrip: jest.fn(() => ({
    selectedTripId: null,
    isLoadingSelectedTrip: false,
    setSelectedTripId: jest.fn(),
  })),
  useAutoSelectFirstTrip: jest.fn(),
}));

jest.mock("~/hooks/community/useCommunityFeed", () => ({
  useCommunityFeed: jest.fn(() => ({
    feedQuery: {
      isLoading: false,
      isRefetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
    },
    filteredActivities: [],
    refreshFeed: jest.fn(),
    handleToggleHeart: jest.fn(),
    rankingData: {},
    avatarUrls: {},
  })),
}));

const mockUseAuth = jest.requireMock("@mirai-app/auth/client").useAuth;

describe("CommunityScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a redirect to login when unauthenticated", () => {
    render(<CommunityScreen />);

    expect(screen.getByTestId("redirect-to-login")).toBeTruthy();
    expect(screen.getByTestId("redirect-to-login").props["data-href"]).toBe("/auth/login");
  });

  it("does not render a redirect when authenticated", () => {
    mockUseAuth.mockReturnValue({
      session: { access_token: "token" },
      isLoading: false,
      isAuthenticated: true,
      signInWithOtp: jest.fn(),
      signInWithPassword: jest.fn(),
      verifyOtp: jest.fn(),
      refreshSession: jest.fn(),
      signOut: jest.fn(),
      user: { id: "user-1" },
    });

    render(<CommunityScreen />);

    expect(screen.queryByTestId("redirect-to-login")).toBeNull();
  });
});
