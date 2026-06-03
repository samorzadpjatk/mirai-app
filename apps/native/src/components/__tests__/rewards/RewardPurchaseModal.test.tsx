import { fireEvent } from "@testing-library/react-native";
import RewardPurchaseModal from "../../rewards/RewardPurchaseModal";
import type { RewardListItem } from "../../rewards/types";
import { renderWithProviders } from "../helpers/renderWithProviders";

const baseReward = (overrides: Partial<RewardListItem> = {}): RewardListItem => ({
  id: "reward-1",
  name: "Test Reward",
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

describe("RewardPurchaseModal", () => {
  it("renders reward info when visible", () => {
    const { getByText } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={false}
      />,
    );

    expect(getByText("Claim reward")).toBeTruthy();
    expect(getByText("Test Reward")).toBeTruthy();
    expect(getByText("50 coins / item")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = renderWithProviders(
      <RewardPurchaseModal
        visible={false}
        reward={baseReward()}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={false}
      />,
    );

    expect(queryByText("Claim reward")).toBeNull();
  });

  it("calls onClose when close button pressed", () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="1"
        onClose={onClose}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={false}
      />,
    );

    fireEvent.press(getByTestId("close-purchase-modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onQuantityChange when input changes", () => {
    const onQuantityChange = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={onQuantityChange}
        onConfirm={jest.fn()}
        isPending={false}
      />,
    );

    fireEvent.changeText(getByTestId("quantity-input"), "3");
    expect(onQuantityChange).toHaveBeenCalledWith("3");
  });

  it("calls onConfirm when confirm button pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    fireEvent.press(getByTestId("confirm-purchase"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows claiming text when pending", () => {
    const { getByText } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={true}
      />,
    );

    expect(getByText("Claiming...")).toBeTruthy();
  });

  it("disables confirm when pending", () => {
    const { getByTestId } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={true}
      />,
    );

    expect(getByTestId("confirm-purchase")).toBeDisabled();
  });

  it("calculates total cost correctly", () => {
    const { getByText } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward()}
        quantity="3"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={false}
      />,
    );

    expect(getByText("150 coins")).toBeTruthy();
  });

  it("renders original coin cost when present", () => {
    const { getByText } = renderWithProviders(
      <RewardPurchaseModal
        visible={true}
        reward={baseReward({ originalCoinCost: 75 })}
        quantity="1"
        onClose={jest.fn()}
        onQuantityChange={jest.fn()}
        onConfirm={jest.fn()}
        isPending={false}
      />,
    );

    expect(getByText("75% of total points")).toBeTruthy();
  });
});
