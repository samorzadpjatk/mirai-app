import React from "react";
import { Alert, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import RewardsView from "../../rewards/RewardsView";

const mockPush = jest.fn();
const mockInvalidateQueries = jest.fn(() => Promise.resolve());
const mockRefetch = jest.fn(() => Promise.resolve());
const mockMutateAsync = jest.fn(() => Promise.resolve());

const mockUseRewards = jest.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
  refetch: mockRefetch,
}));

const mockUseMyGroup = jest.fn(() => ({
  group: null,
}));

const mockUseTripDetails = jest.fn(() => ({
  isTripPast: false,
}));

const mockUsePurchaseReward = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

const baseReward = (overrides: Record<string, unknown> = {}) => ({
  id: "reward-1",
  name: "Test Reward",
  description: "A test reward",
  availableQuantity: 10,
  image: null,
  images: [],
  signedImageUrls: [],
  coinCost: 50,
  originalCoinCost: undefined,
  createdBy: {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  tripId: "trip-1",
  canAfford: true,
  isEligibleToBuy: true,
  isOutOfStock: false,
  purchasedCount: 0,
  ...overrides,
});

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseQueryClient = jest.fn(() => ({
  invalidateQueries: mockInvalidateQueries,
}));

jest.mock("@tanstack/react-query", () => {
  return {
    QueryClient: class MockQueryClient {
      mount = jest.fn();
      unmount = jest.fn();
      isFetching = jest.fn(() => 0);
      getQueryCache = jest.fn(() => ({ subscribe: jest.fn() }));
      getMutationCache = jest.fn(() => ({ subscribe: jest.fn() }));
      getDefaultOptions = jest.fn(() => ({}));
      setDefaultOptions = jest.fn();
      getQueryDefaults = jest.fn();
      setQueryDefaults = jest.fn();
      getMutationDefaults = jest.fn();
      setMutationDefaults = jest.fn();
      clear = jest.fn();
      resetQueries = jest.fn();
      cancelQueries = jest.fn();
      invalidateQueries = jest.fn();
      refetchQueries = jest.fn();
      fetchQuery = jest.fn();
      prefetchQuery = jest.fn();
      fetchInfiniteQuery = jest.fn();
      prefetchInfiniteQuery = jest.fn();
      setQueryData = jest.fn();
      getQueryData = jest.fn();
      getQueriesData = jest.fn();
      setQueriesData = jest.fn();
      setQueryDefaults = jest.fn();
      getQueryState = jest.fn();
      removeQueries = jest.fn();
      removeQueryCache = jest.fn();
      setMutationCache = jest.fn();
      getMutationCache = jest.fn();
      executeMutation = jest.fn();
      getLogger = jest.fn(() => ({ log: jest.fn(), error: jest.fn() }));
      defaultOptions = {};
    },
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
    useQueryClient: () => mockUseQueryClient(),
  };
});

jest.mock("~/hooks/rewards", () => ({
  useRewards: (tripId: string) => mockUseRewards(tripId),
  usePurchaseReward: () => mockUsePurchaseReward(),
}));

jest.mock("~/hooks/groups", () => ({
  useMyGroup: (tripId: string) => mockUseMyGroup(tripId),
}));

jest.mock("~/hooks/trips", () => ({
  useTripDetails: (tripId: string) => mockUseTripDetails(tripId),
}));

jest.mock("@expo/vector-icons", () => {
  const { View } = jest.requireActual("react-native");
  return {
    Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
      return <View testID={`icon-${name}`} style={{ width: size, height: size, color }} />;
    },
  };
});

describe("RewardsView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUseRewards.mockReturnValue({ data: [], isLoading: false, error: null, refetch: mockRefetch });
    mockUseMyGroup.mockReturnValue({ group: null });
    mockUseTripDetails.mockReturnValue({ isTripPast: false });
    mockUsePurchaseReward.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  });

  const defaultProps = { tripId: "trip-1" };

  it("renders loading state", () => {
    mockUseRewards.mockReturnValue({ data: [], isLoading: true, error: null, refetch: mockRefetch });

    const { getByText, getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("Loading rewards...")).toBeTruthy();
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseRewards.mockReturnValue({ data: [], isLoading: false, error: new Error("Failed to load"), refetch: mockRefetch });

    const { getByText, getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("Failed to load rewards")).toBeTruthy();
    expect(getByTestId("icon-alert-circle")).toBeTruthy();
  });

  it("renders empty state", () => {
    const { getByText, getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("No rewards available for this trip")).toBeTruthy();
    expect(getByTestId("icon-gift")).toBeTruthy();
  });

  it("renders reward cards and actions", () => {
    mockUseRewards.mockReturnValue({ data: [baseReward({ originalCoinCost: 25 })], isLoading: false, error: null, refetch: mockRefetch });
    mockUseMyGroup.mockReturnValue({ group: { id: "group-1", name: "Team A", coins: 500 } });

    const { getByText, getAllByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("Rewards")).toBeTruthy();
    expect(getByText("History")).toBeTruthy();
    expect(getByText("Team A")).toBeTruthy();
    expect(getByText("500 coins")).toBeTruthy();
    expect(getByText("Test Reward")).toBeTruthy();
    expect(getByText("A test reward")).toBeTruthy();
    expect(getByText("50 coins")).toBeTruthy();
    expect(getByText("10 pcs.")).toBeTruthy();
    expect(getByText("25% of total points")).toBeTruthy();
    expect(getAllByText("Claim reward").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to history when history button is pressed", () => {
    mockUseRewards.mockReturnValue({ data: [baseReward()], isLoading: false, error: null, refetch: mockRefetch });

    const { getByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    fireEvent.press(getByText("History"));

    expect(mockPush).toHaveBeenCalledWith({ pathname: "/trips/rewards/history", params: { tripId: "trip-1" } });
  });

  it("opens purchase modal when claim button is pressed", () => {
    mockUseRewards.mockReturnValue({ data: [baseReward()], isLoading: false, error: null, refetch: mockRefetch });
    mockUseMyGroup.mockReturnValue({ group: { id: "group-1", name: "Team A", coins: 500 } });

    const { getAllByText, getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    fireEvent.press(getAllByText("Claim reward")[0]);

    expect(getByTestId("purchase-modal")).toBeTruthy();
  });

  it("shows sold out, insufficient coins, and only leader states", () => {
    mockUseRewards.mockReturnValue({
      data: [
        baseReward({ id: "sold-out", isOutOfStock: true, availableQuantity: 0 }),
        baseReward({ id: "no-coins", canAfford: false, coinCost: 1000 }),
        baseReward({ id: "leader-only", isEligibleToBuy: false }),
      ],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    mockUseTripDetails.mockReturnValue({ isTripPast: false });

    const { getAllByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getAllByText("Sold out").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("Not enough coins").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("Only group leader").length).toBeGreaterThanOrEqual(1);
  });

  it("shows trip ended state when trip is past", () => {
    mockUseRewards.mockReturnValue({
      data: [baseReward()],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    mockUseTripDetails.mockReturnValue({ isTripPast: true });

    const { getAllByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getAllByText("Trip ended").length).toBeGreaterThanOrEqual(1);
  });

  it("renders refresh control and image placeholder icon", () => {
    mockUseRewards.mockReturnValue({ data: [baseReward({ image: null, images: [] })], isLoading: false, error: null, refetch: mockRefetch });

    const { getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByTestId("rewards-scroll-view")).toBeTruthy();
    expect(getByTestId("icon-gift-outline")).toBeTruthy();
  });

  it("renders original coin cost percentage when available", () => {
    mockUseRewards.mockReturnValue({ data: [baseReward({ originalCoinCost: 25 })], isLoading: false, error: null, refetch: mockRefetch });

    const { getByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("25% of total points")).toBeTruthy();
  });
});
