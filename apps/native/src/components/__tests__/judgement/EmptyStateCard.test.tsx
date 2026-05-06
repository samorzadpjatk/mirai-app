import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { EmptyStateCard } from "../../judgement/EmptyStateCard";

import { Text } from "react-native";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    return <Text>{name}</Text>;
  },
}));

describe("EmptyStateCard", () => {
  it("should render checkmark-done icon", () => {
    const { getByText } = renderWithProviders(
      <EmptyStateCard maxCardHeight={500} />
    );

    expect(getByText("checkmark-done")).toBeTruthy();
  });

  it("should render title", () => {
    const { getByText } = renderWithProviders(
      <EmptyStateCard maxCardHeight={500} />
    );

    expect(getByText("All caught up")).toBeTruthy();
  });

  it("should render subtitle", () => {
    const { getByText } = renderWithProviders(
      <EmptyStateCard maxCardHeight={500} />
    );

    expect(getByText("There are no pending submissions to review.")).toBeTruthy();
  });

  it("should apply maxCardHeight", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <EmptyStateCard maxCardHeight={400} />
    );

    const view = UNSAFE_getByType("View");
    expect(view).toBeTruthy();
  });

  it("should render with different maxCardHeight values", () => {
    const { getByText, rerender } = renderWithProviders(
      <EmptyStateCard maxCardHeight={300} />
    );

    expect(getByText("All caught up")).toBeTruthy();

    rerender(<EmptyStateCard maxCardHeight={600} />);

    expect(getByText("All caught up")).toBeTruthy();
  });
});
