import React from "react";
import { Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapModalUserItem } from "../../map/modals/MapModalUserItem";



describe("MapModalUserItem", () => {
  it("should render with name", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" />);

    expect(screen.getByTestId("item-title").children[0]).toBe("John Doe");
  });

  it("should render with subtitle", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" subtitle="Sharing location" />);

    expect(screen.getByTestId("item-subtitle").children[0]).toBe("Sharing location");
  });

  it("should render with imageUrl", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" imageUrl="https://example.com/avatar.jpg" />,
    );

    expect(screen.getByTestId("user-avatar-image")).toBeTruthy();
  });

  it("should handle onPress", () => {
    const mockOnPress = jest.fn();
    renderWithProviders(<MapModalUserItem name="John Doe" onPress={mockOnPress} />);

    fireEvent.press(screen.getByTestId("themed-list-item"));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it("should handle disabled state", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" disabled={true} />);

    expect(screen.getByTestId("themed-list-item")).toBeTruthy();
  });

  it("should handle selected state", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" selected={true} />);

    expect(screen.getByTestId("themed-list-item")).toBeTruthy();
  });

  it("should handle bordered state", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" bordered={true} />);

    expect(screen.getByTestId("themed-list-item")).toBeTruthy();
  });

  it("should render rightElement", () => {
    renderWithProviders(
      <MapModalUserItem
        name="John Doe"
        rightElement={<Text testID="right-element">Remove</Text>}
      />,
    );

    expect(screen.getByText("Remove")).toBeOnTheScreen();
  });

  it("should show 'Unknown' when name is empty", () => {
    renderWithProviders(<MapModalUserItem name="" />);

    expect(screen.getByTestId("item-title").children[0]).toBe("Unknown");
  });

  it("should handle null imageUrl", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" imageUrl={null} />);

    expect(screen.getByTestId("user-avatar-initials-text")).toBeTruthy();
  });

  it("should render without optional props", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" />);

    expect(screen.getByTestId("item-title")).toBeOnTheScreen();
    expect(screen.queryByTestId("item-subtitle")).toBeNull();
  });
});
