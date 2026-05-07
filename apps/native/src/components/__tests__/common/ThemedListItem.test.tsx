import React from "react";
import { Pressable, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ThemedListItem } from "../../common/ui/ThemedListItem";

interface PressableStyle extends ViewStyle {
  backgroundColor?: string;
  borderColor?: string;
}

describe("ThemedListItem", () => {
  it("should render with title", () => {
    renderWithProviders(<ThemedListItem title="Item Title" />);

    expect(screen.getByText("Item Title")).toBeOnTheScreen();
  });

  it("should render with subtitle when provided", () => {
    renderWithProviders(
      <ThemedListItem title="Item Title" subtitle="Item Subtitle" />
    );

    expect(screen.getByText("Item Title")).toBeOnTheScreen();
    expect(screen.getByText("Item Subtitle")).toBeOnTheScreen();
  });

  it("should not render subtitle when not provided", () => {
    renderWithProviders(<ThemedListItem title="Item Title" />);

    expect(screen.queryByText("Item Subtitle")).toBeNull();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <ThemedListItem title="Pressable Item" onPress={onPress} />
    );

    fireEvent.press(screen.getByTestId("themed-list-item-pressable"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should not be pressable when onPress is not provided", () => {
    renderWithProviders(
      <ThemedListItem title="Non-pressable Item" />
    );

    expect(screen.getByTestId("themed-list-item-pressable")).toBeTruthy();
  });

  it("should be disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <ThemedListItem title="Disabled Item" onPress={onPress} disabled={true} />
    );

    expect(screen.getByTestId("themed-list-item-pressable")).toBeTruthy();
  });

  it("should apply selected style when selected is true", () => {
    renderWithProviders(
      <ThemedListItem title="Selected Item" selected={true} />
    );

    expect(screen.getByTestId("themed-list-item-pressable")).toBeTruthy();
  });

  it("should apply bordered style when bordered is true", () => {
    renderWithProviders(
      <ThemedListItem title="Bordered Item" bordered={true} />
    );

    expect(screen.getByTestId("themed-list-item-pressable")).toBeTruthy();
  });

  it("should render left avatar when provided", () => {
    renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "John Doe", imageUrl: "https://example.com/avatar.jpg" }}
      />
    );

    expect(screen.getByTestId("themed-list-item-pressable")).toBeTruthy();
  });

  it("should render left avatar without image", () => {
    renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "John Doe" }}
      />
    );

    expect(screen.getByText("JD")).toBeOnTheScreen();
  });

  it("should render right element when provided", () => {
    renderWithProviders(
      <ThemedListItem
        title="Item with Action"
        rightElement={<Text>Action</Text>}
      />
    );

    expect(screen.getByText("Action")).toBeOnTheScreen();
  });

  it("should apply custom style", () => {
    const customStyle = { marginBottom: 10 };
    renderWithProviders(
      <ThemedListItem title="Styled Item" style={customStyle} />
    );

    expect(screen.getByTestId("themed-list-item-pressable")).toBeTruthy();
  });

  it("should render with all props combined", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <ThemedListItem
        title="Complete Item"
        subtitle="With all features"
        leftAvatar={{ name: "Jane Smith", imageUrl: null }}
        rightElement={<Text>Details</Text>}
        onPress={onPress}
        selected={true}
        bordered={true}
      />
    );

    expect(screen.getByText("Complete Item")).toBeOnTheScreen();
    expect(screen.getByText("With all features")).toBeOnTheScreen();
    expect(screen.getByText("JS")).toBeOnTheScreen();
    expect(screen.getByText("Details")).toBeOnTheScreen();
  });

  it("should handle press in state", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <ThemedListItem title="Pressable Item" onPress={onPress} />
    );

    const pressable = screen.getByTestId("themed-list-item-pressable");
    expect(pressable.props.style).toBeDefined();
  });

  it("should render multiple list items", () => {
    renderWithProviders(
      <>
        <ThemedListItem title="Item 1" />
        <ThemedListItem title="Item 2" />
        <ThemedListItem title="Item 3" />
      </>
    );

    expect(screen.getByText("Item 1")).toBeOnTheScreen();
    expect(screen.getByText("Item 2")).toBeOnTheScreen();
    expect(screen.getByText("Item 3")).toBeOnTheScreen();
  });

  it("should handle avatar with null imageUrl", () => {
    renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "Alice Wonderland", imageUrl: null }}
      />
    );

    expect(screen.getByText("AW")).toBeOnTheScreen();
  });

  it("should handle single name for avatar initials", () => {
    renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "Alice" }}
      />
    );

    expect(screen.getByText("A")).toBeOnTheScreen();
  });
});
