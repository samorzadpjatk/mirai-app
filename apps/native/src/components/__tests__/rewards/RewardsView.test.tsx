import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import RewardsView from "../../rewards/RewardsView";

let mockUseRewardsReturn = {
  data: null,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
};

let mockUseMyGroupReturn = {
  group: null,
};

let mockUseTripDetailsReturn = {
  isTripPast: false,
};

let mockUsePurchaseRewardReturn = {
  mutateAsync: jest.fn(),
  isPending: false,
};

jest.mock("~/hooks/rewards", () => ({
  useRewards: jest.fn().mockImplementation(() => mockUseRewardsReturn),
  usePurchaseReward: jest.fn().mockImplementation(() => mockUsePurchaseRewardReturn),
}));

jest.mock("~/hooks/groups", () => ({
  useMyGroup: jest.fn().mockImplementation(() => mockUseMyGroupReturn),
}));

jest.mock("~/hooks/trips", () => ({
  useTripDetails: jest.fn().mockImplementation(() => mockUseTripDetailsReturn),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: jest.fn().mockReturnValue({
      invalidateQueries: jest.fn(),
    }),
  };
});

jest.mock("~/components/rewards/RewardCard", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ reward }: { reward: { id: string } }) => <View testID={`reward-card-${reward.id}`} />,
  };
});

jest.mock("~/components/rewards/RewardPurchaseModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="purchase-modal" />,
  };
});

jest.mock("~/components/rewards/RewardDetailsModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="details-modal" />,
  };
});

describe("RewardsView", () => {
  const defaultProps = {
    tripId: "trip-1",
  };

  beforeEach(() => {
    mockUseRewardsReturn = {
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
    mockUseMyGroupReturn = { group: null };
    mockUseTripDetailsReturn = { isTripPast: false };
    mockUsePurchaseRewardReturn = {
      mutateAsync: jest.fn(),
      isPending: false,
    };
  });

  it("should render loading state when isLoading is true", () => {
    mockUseRewardsReturn.isLoading = true;
    const { getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("should render error state when error exists", () => {
    mockUseRewardsReturn.error = new Error("Failed to load");
    const { getByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("Failed to load rewards")).toBeTruthy();
  });

  it("should render empty state when no rewards", () => {
    mockUseRewardsReturn.data = [];
    const { getByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("No rewards available for this trip")).toBeTruthy();
  });

  it("should render rewards list when data exists", () => {
    mockUseRewardsReturn.data = [
      { id: "reward-1", name: "Reward 1" },
      { id: "reward-2", name: "Reward 2" },
    ];
    const { getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByTestId("reward-card-reward-1")).toBeTruthy();
    expect(getByTestId("reward-card-reward-2")).toBeTruthy();
  });

  it("should render group coins info when user has a group", () => {
    mockUseRewardsReturn.data = [{ id: "reward-1", name: "Reward 1" }];
    mockUseMyGroupReturn.group = { name: "Group A", coins: 500 };
    const { getByText } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByText("Group A")).toBeTruthy();
    expect(getByText("500 coins")).toBeTruthy();
  });

  it("should render modals", () => {
    mockUseRewardsReturn.data = [{ id: "reward-1", name: "Reward 1" }];
    const { getByTestId } = renderWithProviders(<RewardsView {...defaultProps} />);

    expect(getByTestId("purchase-modal")).toBeTruthy();
    expect(getByTestId("details-modal")).toBeTruthy();
  });
});
