import React from "react";
import { View, Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapModalUserItem } from "../../map/modals/MapModalUserItem";

jest.mock("~/components/common/ui", () => ({
  ThemedListItem: function MockThemedListItem({
    title,
    subtitle,
    leftAvatar,
    rightElement,
    onPress,
    disabled,
    selected,
    bordered,
  }: {
    title: string;
    subtitle?: string;
    leftAvatar?: { name: string; imageUrl?: string | null };
    rightElement?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    selected?: boolean;
    bordered?: boolean;
  }) {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      {
        testID: "themed-list-item",
        onPress,
        disabled,
        "data-selected": selected,
        "data-bordered": bordered,
      },
      React.createElement(Text, { testID: "item-title" }, title),
      subtitle && React.createElement(Text, { testID: "item-subtitle" }, subtitle),
      leftAvatar && React.createElement(Text, { testID: "item-avatar" }, leftAvatar.name),
      rightElement
    );
  },
}));

describe("MapModalUserItem", () => {
  it("should render with name", () => {
    const { getByTestId } = renderWithProviders(<MapModalUserItem name="John Doe" />);

    expect(getByTestId("item-title").children[0]).toBe("John Doe");
  });

  it("should render with subtitle", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" subtitle="Sharing location" />
    );

    expect(getByTestId("item-subtitle").children[0]).toBe("Sharing location");
  });

  it("should render with imageUrl", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" imageUrl="https://example.com/avatar.jpg" />
    );

    expect(getByTestId("item-avatar").children[0]).toBe("John Doe");
  });

  it("should handle onPress", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId("themed-list-item"));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it("should handle disabled state", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" disabled={true} />
    );

    const item = getByTestId("themed-list-item");
    expect(item.props.disabled).toBe(true);
  });

  it("should handle selected state", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" selected={true} />
    );

    const item = getByTestId("themed-list-item");
    expect(item.props["data-selected"]).toBe(true);
  });

  it("should handle bordered state", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" bordered={true} />
    );

    const item = getByTestId("themed-list-item");
    expect(item.props["data-bordered"]).toBe(true);
  });

  it("should render rightElement", () => {
    const { getByText } = renderWithProviders(
      <MapModalUserItem
        name="John Doe"
        rightElement={<Text testID="right-element">Remove</Text>}
      />
    );

    expect(getByText("Remove")).toBeTruthy();
  });

  it("should show 'Unknown' when name is empty", () => {
    const { getByTestId } = renderWithProviders(<MapModalUserItem name="" />);

    expect(getByTestId("item-title").children[0]).toBe("Unknown");
  });

  it("should handle null imageUrl", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" imageUrl={null} />
    );

    expect(getByTestId("item-avatar").children[0]).toBe("John Doe");
  });

  it("should render without optional props", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <MapModalUserItem name="John Doe" />
    );

    expect(getByTestId("item-title")).toBeTruthy();
    expect(queryByTestId("item-subtitle")).toBeNull();
  });
});
