import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ThemedCard } from "../../common/ui/ThemedCard";

describe("ThemedCard", () => {
  it("should render children", () => {
    const { getByText } = renderWithProviders(
      <ThemedCard>
        <Text>Card Content</Text>
      </ThemedCard>
    );

    expect(getByText("Card Content")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <ThemedCard onPress={onPress}>
        <Text>Pressable Card</Text>
      </ThemedCard>
    );

    fireEvent.press(getByText("Pressable Card"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render cards with additional props", () => {
    const { getByText } = renderWithProviders(
      <ThemedCard bordered selected variant="interactive">
        <Text>Decorated Card</Text>
      </ThemedCard>
    );

    expect(getByText("Decorated Card")).toBeTruthy();
  });
});
