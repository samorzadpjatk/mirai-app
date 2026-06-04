import { fireEvent, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemedCard } from "../../common/ui/ThemedCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

describe("ThemedCard", () => {
  it("should render children", () => {
    renderWithProviders(
      <ThemedCard>
        <Text>Card Content</Text>
      </ThemedCard>,
    );

    expect(screen.getByText("Card Content")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <ThemedCard onPress={onPress}>
        <Text>Pressable Card</Text>
      </ThemedCard>,
    );

    fireEvent.press(screen.getByText("Pressable Card"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render cards with additional props", () => {
    renderWithProviders(
      <ThemedCard bordered selected variant="interactive">
        <Text>Decorated Card</Text>
      </ThemedCard>,
    );

    expect(screen.getByText("Decorated Card")).toBeOnTheScreen();
  });
});
