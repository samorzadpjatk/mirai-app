import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import RewardsView from "../../rewards/RewardsView";
import type { RewardListItem } from "../../rewards/types";

const baseReward = (overrides: Partial<RewardListItem> = {}): RewardListItem => ({
  id: "reward-1",
  name: "Reward 1",
  description: "A test reward",
  availableQuantity: 10,
  image: null,
  images: [],
  signedImageUrls: [],
  signedImageUrl: null,
  coinCost: 50,
  createdBy: { id: "user-1", firstName: "John", lastName: "Doe" },
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
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock("~/components/rewards/RewardCard", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ reward }: { reward: { id: string } }) => (
      <View testID={`reward-card-${reward.id}`} />
    ),
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
    jest.clearAllMocks();
    server.resetHandlers();
    // Default handlers: all endpoints return empty/null
    server.use(
      createORPCHandler(["reward", "getByTrip"], () => []),
      createORPCHandler(["group", "getMy"], () => null),
      createORPCHandler(["trip", "getByIdFull"], () => ({
        trip: null,
        groups: [],
        challenges: [],
        sponsors: [],
        latestNews: [],
      })),
    );
  });

  it("should render loading state when isLoading is true", async () => {
    server.use(
      createORPCHandler(
        ["reward", "getByTrip"],
        () =>
          new Promise(() => {
            /* intentionally never resolves */
          }),
      ),
    );
    const { getByTestId } = renderWithMSW(<RewardsView {...defaultProps} />);
    await waitFor(() => expect(getByTestId("loading-indicator")).toBeTruthy());
  });

  it("should render error state when error exists", async () => {
    server.use(
      createORPCHandler(["reward", "getByTrip"], () => {
        throw new Error("Failed to load");
      }),
    );
    const { getByText } = renderWithMSW(<RewardsView {...defaultProps} />);
    await waitFor(() => expect(getByText("Failed to load rewards")).toBeTruthy());
  });

  it("should render empty state when no rewards", async () => {
    const { getByText } = renderWithMSW(<RewardsView {...defaultProps} />);
    await waitFor(() => expect(getByText("No rewards available for this trip")).toBeTruthy());
  });

  it("should render rewards list when data exists", async () => {
    server.use(
      createORPCHandler(["reward", "getByTrip"], () => [
        baseReward({ id: "reward-1", name: "Reward 1" }),
        baseReward({ id: "reward-2", name: "Reward 2" }),
      ]),
    );
    const { getByTestId } = renderWithMSW(<RewardsView {...defaultProps} />);
    await waitFor(() => expect(getByTestId("reward-card-reward-1")).toBeTruthy());
    await waitFor(() => expect(getByTestId("reward-card-reward-2")).toBeTruthy());
  });

  it("should render group coins info when user has a group", async () => {
    server.use(
      createORPCHandler(["reward", "getByTrip"], () => [
        baseReward({ id: "reward-1", name: "Reward 1" }),
      ]),
      createORPCHandler(["group", "getMy"], () => ({ name: "Group A", coins: 500 })),
    );
    const { getByText } = renderWithMSW(<RewardsView {...defaultProps} />);
    await waitFor(() => expect(getByText("Group A")).toBeTruthy());
    await waitFor(() => expect(getByText("500 coins")).toBeTruthy());
  });

  it("should render modals", async () => {
    server.use(
      createORPCHandler(["reward", "getByTrip"], () => [
        baseReward({ id: "reward-1", name: "Reward 1" }),
      ]),
    );
    const { getByTestId } = renderWithMSW(<RewardsView {...defaultProps} />);
    await waitFor(() => expect(getByTestId("purchase-modal")).toBeTruthy());
    await waitFor(() => expect(getByTestId("details-modal")).toBeTruthy());
  });
});
