import React from "react";
import { Alert } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import RewardsHistoryView from "../../rewards/RewardsHistoryView";

const mockMutateAsync = jest.fn(() => Promise.resolve());
const mockFetchNextPage = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());

const mockUseRewardPurchaseHistory = jest.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: mockFetchNextPage,
  isRefetching: false,
  refetch: mockRefetch,
}));

const mockUseUpdateMyRewardPurchaseStatus = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

const baseReward = () => ({
  id: "reward-1",
  name: "Test Reward",
  description: "A test reward",
  availableQuantity: 10,
  image: null,
  images: [],
  signedImageUrls: [],
  coinCost: 50,
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
});

const basePurchase = (overrides: Record<string, unknown> = {}) => ({
  id: "purchase-1",
  reward: baseReward(),
  quantity: 1,
  totalCost: 50,
  status: "BOUGHT",
  purchasedAt: new Date().toISOString(),
  group: { id: "group-1", name: "Group A" },
  purchasedBy: null,
  ...overrides,
});

jest.mock("~/hooks/rewards", () => ({
  useRewardPurchaseHistory: (tripId: string) => mockUseRewardPurchaseHistory(tripId),
  useUpdateMyRewardPurchaseStatus: () => mockUseUpdateMyRewardPurchaseStatus(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
    const { View } = jest.requireActual("react-native");
    return <View testID={`icon-${name}`} style={{ width: size, height: size, color }} />;
  },
}));

describe("RewardsHistoryView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUseRewardPurchaseHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
      isRefetching: false,
      refetch: mockRefetch,
    });
    mockUseUpdateMyRewardPurchaseStatus.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  });

  const defaultProps = { tripId: "trip-1" };

  it("renders loading state", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({ data: [], isLoading: true, error: null, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: mockFetchNextPage, isRefetching: false, refetch: mockRefetch });

    const { getByText, getByTestId } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByText("Loading claim history...")).toBeTruthy();
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({ data: [], isLoading: false, error: new Error("Failed to load"), hasNextPage: false, isFetchingNextPage: false, fetchNextPage: mockFetchNextPage, isRefetching: false, refetch: mockRefetch });

    const { getByText, getByTestId } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByText("Failed to load claim history")).toBeTruthy();
    expect(getByTestId("icon-warning-outline")).toBeTruthy();
  });

  it("renders empty state", () => {
    const { getByText, getByTestId } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByText("No reward claims yet")).toBeTruthy();
    expect(getByTestId("icon-time-outline")).toBeTruthy();
  });

  it("renders purchase list and labels", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({ data: [basePurchase({ status: "BOUGHT", purchasedBy: { firstName: "John", lastName: "Doe" } })], isLoading: false, error: null, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: mockFetchNextPage, isRefetching: false, refetch: mockRefetch });

    const { getByText } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByText("Test Reward")).toBeTruthy();
    expect(getByText("Group: Group A")).toBeTruthy();
    expect(getByText("Bought")).toBeTruthy();
    expect(getByText("Claimed by: John Doe")).toBeTruthy();
  });

  it("shows pickup and cancel actions for matching statuses", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({
      data: [
        basePurchase({ id: "accepted", status: "ACCEPTED", purchasedBy: null }),
        basePurchase({ id: "bought", status: "BOUGHT", purchasedBy: null }),
      ],
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
      isRefetching: false,
      refetch: mockRefetch,
    });

    const { getByText } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByText("I want to pick up")).toBeTruthy();
    expect(getByText("Cancel claim")).toBeTruthy();
  });

  it("handles pickup action", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({ data: [basePurchase({ status: "ACCEPTED" })], isLoading: false, error: null, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: mockFetchNextPage, isRefetching: false, refetch: mockRefetch });

    const { getByText } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    fireEvent.press(getByText("I want to pick up"));

    expect(mockMutateAsync).toHaveBeenCalledWith({ purchaseId: "purchase-1", status: "IN_DELIVERY" });
  });

  it("handles cancel action", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({ data: [basePurchase({ status: "BOUGHT" })], isLoading: false, error: null, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: mockFetchNextPage, isRefetching: false, refetch: mockRefetch });

    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const destructiveButton = buttons?.find((b: { style?: string }) => b.style === "destructive");
      if (destructiveButton?.onPress) {
        destructiveButton.onPress();
      }
    });

    const { getByText } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    fireEvent.press(getByText("Cancel claim"));

    expect(mockMutateAsync).toHaveBeenCalledWith({ purchaseId: "purchase-1", status: "CANCELLED" });
  });

  it("renders pickup details and loading more state", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({
      data: [basePurchase({ status: "IN_DELIVERY", collectionMethod: "Pickup at reception" })],
      isLoading: false,
      error: null,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: mockFetchNextPage,
      isRefetching: false,
      refetch: mockRefetch,
    });

    const { getByText, getByTestId } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByText("Pickup details")).toBeTruthy();
    expect(getByText("Pickup at reception")).toBeTruthy();
    expect(getByText("Loading more claim history...")).toBeTruthy();
    expect(getByTestId("rewards-scroll-view")).toBeTruthy();
  });

  it("renders refresh control and all status labels", () => {
    mockUseRewardPurchaseHistory.mockReturnValue({
      data: [
        basePurchase({ id: "bought", status: "BOUGHT", reward: { ...baseReward(), name: "Reward BOUGHT" } }),
        basePurchase({ id: "accepted", status: "ACCEPTED", reward: { ...baseReward(), name: "Reward ACCEPTED" } }),
        basePurchase({ id: "delivery", status: "IN_DELIVERY", reward: { ...baseReward(), name: "Reward IN_DELIVERY" } }),
        basePurchase({ id: "cancelled", status: "CANCELLED", reward: { ...baseReward(), name: "Reward CANCELLED" } }),
        basePurchase({ id: "delivered", status: "DELIVERED", reward: { ...baseReward(), name: "Reward DELIVERED" } }),
      ],
      isLoading: false,
      error: null,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
      isRefetching: false,
      refetch: mockRefetch,
    });

    const { getByTestId, getByText } = renderWithProviders(<RewardsHistoryView {...defaultProps} />);

    expect(getByTestId("rewards-scroll-view").props.refreshControl).toBeTruthy();
    expect(getByText("Bought")).toBeTruthy();
    expect(getByText("Accepted")).toBeTruthy();
    expect(getByText("In delivery")).toBeTruthy();
    expect(getByText("Cancelled")).toBeTruthy();
    expect(getByText("Delivered")).toBeTruthy();
  });
});
