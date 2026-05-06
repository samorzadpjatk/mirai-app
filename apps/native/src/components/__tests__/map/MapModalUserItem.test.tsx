import React from "react";
import { Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapModalUserItem } from "../../map/modals/MapModalUserItem";

jest.mock("~/components/common/ui", () => {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
  const { createElement } = require("react");
  const { TouchableOpacity, Text } = require("react-native");

  return {
    ThemedListItem: (props) =>
      createElement(
        TouchableOpacity,
        {
          testID: "themed-list-item",
          onPress: props.onPress,
          disabled: props.disabled,
          "data-selected": props.selected,
          "data-bordered": props.bordered,
        },
        createElement(Text, { testID: "item-title" }, props.title),
        props.subtitle
          ? createElement(Text, { testID: "item-subtitle" }, props.subtitle)
          : null,
        props.leftAvatar
          ? createElement(Text, { testID: "item-avatar" }, props.leftAvatar.name)
          : null,
        props.rightElement
      ),
  };
  /* eslint-enable */
});

describe("MapModalUserItem", () => {
  it("should render with name", () => {
    renderWithProviders(<MapModalUserItem name="John Doe" />);

    expect(screen.getByTestId("item-title").children[0]).toBe("John Doe");
  });

  it("should render with subtitle", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" subtitle="Sharing location" />
    );

    expect(screen.getByTestId("item-subtitle").children[0]).toBe("Sharing location");
  });

  it("should render with imageUrl", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" imageUrl="https://example.com/avatar.jpg" />
    );

    expect(screen.getByTestId("item-avatar").children[0]).toBe("John Doe");
  });

  it("should handle onPress", () => {
    const mockOnPress = jest.fn();
    renderWithProviders(
      <MapModalUserItem name="John Doe" onPress={mockOnPress} />
    );

    fireEvent.press(screen.getByTestId("themed-list-item"));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it("should handle disabled state", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" disabled={true} />
    );

    const item = screen.getByTestId("themed-list-item");
    expect(item.props.disabled).toBe(true);
  });

  it("should handle selected state", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" selected={true} />
    );

    const item = screen.getByTestId("themed-list-item");
    expect(item.props["data-selected"]).toBe(true);
  });

  it("should handle bordered state", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" bordered={true} />
    );

    const item = screen.getByTestId("themed-list-item");
    expect(item.props["data-bordered"]).toBe(true);
  });

  it("should render rightElement", () => {
    renderWithProviders(
      <MapModalUserItem
        name="John Doe"
        rightElement={<Text testID="right-element">Remove</Text>}
      />
    );

    expect(screen.getByText("Remove")).toBeOnTheScreen();
  });

  it("should show 'Unknown' when name is empty", () => {
    renderWithProviders(<MapModalUserItem name="" />);

    expect(screen.getByTestId("item-title").children[0]).toBe("Unknown");
  });

  it("should handle null imageUrl", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" imageUrl={null} />
    );

    expect(screen.getByTestId("item-avatar").children[0]).toBe("John Doe");
  });

  it("should render without optional props", () => {
    renderWithProviders(
      <MapModalUserItem name="John Doe" />
    );

    expect(screen.getByTestId("item-title")).toBeOnTheScreen();
    expect(screen.queryByTestId("item-subtitle")).toBeNull();
  });
});
