import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import RewardDetailsModal from "../../rewards/RewardDetailsModal";
import type { RewardListItem } from "../../rewards/types";

const baseReward = (overrides: Partial<RewardListItem> = {}): RewardListItem => ({
  id: "reward-1",
  name: "Test Reward",
  description: "A detailed description",
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

describe("RewardDetailsModal", () => {
  it("renders reward details when visible", () => {
    const { getByText } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward()}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    expect(getByText("Reward details")).toBeTruthy();
    expect(getByText("Test Reward")).toBeTruthy();
    expect(getByText("A detailed description")).toBeTruthy();
  });

  it("does not render when reward is null", () => {
    const { queryByText } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={null}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    expect(queryByText("Reward details")).toBeNull();
  });

  it("calls onClose when close button pressed", () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward()}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={onClose}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    fireEvent.press(getByTestId("close-details-modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onPurchase when purchase button pressed", () => {
    const onPurchase = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward()}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={onClose}
        onPurchase={onPurchase}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    fireEvent.press(getByTestId("details-purchase-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPurchase).toHaveBeenCalledTimes(1);
  });

  it("disables purchase button when trip is past", () => {
    const { getByTestId } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward()}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={true}
      />,
    );

    expect(getByTestId("details-purchase-button")).toBeDisabled();
  });

  it("shows sold out state in details", () => {
    const { getAllByText } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward({ isOutOfStock: true })}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    expect(getAllByText("Sold out").length).toBeGreaterThanOrEqual(1);
  });

  it("renders carousel dots when multiple images", () => {
    const { getByTestId } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward()}
        images={["url1", "url2", "url3"]}
        carouselWidth={300}
        imageIndex={1}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    expect(getByTestId("image-dot-0")).toBeTruthy();
    expect(getByTestId("image-dot-1")).toBeTruthy();
    expect(getByTestId("image-dot-2")).toBeTruthy();
  });

  it("does not render dots when single image", () => {
    const { queryByTestId } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward()}
        images={["url1"]}
        carouselWidth={300}
        imageIndex={0}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    expect(queryByTestId("image-dot-0")).toBeNull();
  });

  it("renders original coin cost when present", () => {
    const { getByText } = renderWithProviders(
      <RewardDetailsModal
        visible={true}
        reward={baseReward({ originalCoinCost: 75 })}
        images={[]}
        carouselWidth={300}
        imageIndex={0}
        onClose={jest.fn()}
        onPurchase={jest.fn()}
        onImageIndexChange={jest.fn()}
        isTripPast={false}
      />,
    );

    expect(getByText("75% of total points")).toBeTruthy();
  });
});
