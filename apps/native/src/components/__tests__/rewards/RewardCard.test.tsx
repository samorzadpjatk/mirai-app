import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import RewardCard from "../../rewards/RewardCard";
import type { RewardListItem } from "../../rewards/types";

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
  originalCoinCost: null,
  ...overrides,
});

describe("RewardCard", () => {
  it("renders reward name and description", () => {
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward()}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getByText("Test Reward")).toBeTruthy();
    expect(getByText("A test reward")).toBeTruthy();
  });

  it("renders coin cost and availability", () => {
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward()}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getByText("50 coins")).toBeTruthy();
    expect(getByText("10 pcs.")).toBeTruthy();
  });

  it("shows sold out state", () => {
    const { getAllByText } = renderWithProviders(
      <RewardCard
        reward={baseReward({ isOutOfStock: true, availableQuantity: 0 })}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getAllByText("Sold out").length).toBeGreaterThanOrEqual(1);
  });

  it("shows not enough coins state", () => {
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward({ canAfford: false })}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getByText("Not enough coins")).toBeTruthy();
  });

  it("shows trip ended state", () => {
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward()}
        justRefreshed={false}
        isTripPast={true}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getByText("Trip ended")).toBeTruthy();
  });

  it("shows only group leader state", () => {
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward({ isEligibleToBuy: false })}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getByText("Only group leader")).toBeTruthy();
  });

  it("calls onPress when card is tapped", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward()}
        justRefreshed={false}
        isTripPast={false}
        onPress={onPress}
        onPurchasePress={jest.fn()}
      />,
    );

    fireEvent.press(getByText("Tap to read full description"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onPurchasePress when claim button is tapped", () => {
    const onPurchasePress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardCard
        reward={baseReward()}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={onPurchasePress}
      />,
    );

    fireEvent.press(getByTestId("purchase-button-reward-1"));
    expect(onPurchasePress).toHaveBeenCalledTimes(1);
  });

  it("disables purchase button when out of stock", () => {
    const onPurchasePress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardCard
        reward={baseReward({ isOutOfStock: true })}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={onPurchasePress}
      />,
    );

    expect(getByTestId("purchase-button-reward-1")).toBeDisabled();
  });

  it("shows green border when just refreshed", () => {
    const { getByTestId } = renderWithProviders(
      <RewardCard
        reward={baseReward()}
        justRefreshed={true}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    const card = getByTestId("reward-card-reward-1");
    const style = card.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flatStyle.borderColor).toBe("#10b981");
  });

  it("shows red border when out of stock", () => {
    const { getByTestId } = renderWithProviders(
      <RewardCard
        reward={baseReward({ isOutOfStock: true })}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    const card = getByTestId("reward-card-reward-1");
    const style = card.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flatStyle.borderColor).toBe("#ef4444");
  });

  it("renders original coin cost when present", () => {
    const { getByText } = renderWithProviders(
      <RewardCard
        reward={baseReward({ originalCoinCost: 75 })}
        justRefreshed={false}
        isTripPast={false}
        onPress={jest.fn()}
        onPurchasePress={jest.fn()}
      />,
    );

    expect(getByText("75% of total points")).toBeTruthy();
  });
});
