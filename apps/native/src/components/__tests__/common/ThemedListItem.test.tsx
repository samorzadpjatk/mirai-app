import React from "react";
import { Pressable, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ThemedListItem } from "../../common/ui/ThemedListItem";

interface PressableStyle extends ViewStyle {
  backgroundColor?: string;
  borderColor?: string;
}

describe("ThemedListItem", () => {
  it("should render with title", () => {
    const { getByText } = renderWithProviders(
      <ThemedListItem title="Item Title" />
    );

    expect(getByText("Item Title")).toBeTruthy();
  });

  it("should render with subtitle when provided", () => {
    const { getByText } = renderWithProviders(
      <ThemedListItem title="Item Title" subtitle="Item Subtitle" />
    );

    expect(getByText("Item Title")).toBeTruthy();
    expect(getByText("Item Subtitle")).toBeTruthy();
  });

  it("should not render subtitle when not provided", () => {
    const { queryByText } = renderWithProviders(
      <ThemedListItem title="Item Title" />
    );

    expect(queryByText("Item Subtitle")).toBeNull();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Pressable Item" onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(Pressable));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should not be pressable when onPress is not provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Non-pressable Item" />
    );

    const pressable = UNSAFE_getByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
  });

  it("should be disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Disabled Item" onPress={onPress} disabled={true} />
    );

    const pressable = UNSAFE_getByType(Pressable);
    expect(pressable.props.disabled).toBe(true);
  });

  it("should apply selected style when selected is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Selected Item" selected={true} />
    );

    const pressable = UNSAFE_getByType(Pressable);
    const pressableProps = pressable.props as PressableProps;
    expect(typeof pressableProps.style).toBe("function");
    const styleFn = pressableProps.style as (state: { pressed: boolean }) => PressableStyle[];
    const resolvedStyle = styleFn({ pressed: false });
    expect(resolvedStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: expect.any(String) as string,
          borderColor: expect.any(String) as string,
        }),
      ])
    );
  });

  it("should apply bordered style when bordered is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Bordered Item" bordered={true} />
    );

    const pressable = UNSAFE_getByType(Pressable);
    const pressableProps = pressable.props as PressableProps;
    expect(typeof pressableProps.style).toBe("function");
    const styleFn = pressableProps.style as (state: { pressed: boolean }) => PressableStyle[];
    const resolvedStyle = styleFn({ pressed: false });
    expect(resolvedStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: expect.any(String) as string }),
      ])
    );
  });

  it("should render left avatar when provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "John Doe", imageUrl: "https://example.com/avatar.jpg" }}
      />
    );

    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should render left avatar without image", () => {
    const { getByText } = renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "John Doe" }}
      />
    );

    expect(getByText("JD")).toBeTruthy();
  });

  it("should render right element when provided", () => {
    const { getByText } = renderWithProviders(
      <ThemedListItem
        title="Item with Action"
        rightElement={<Text>Action</Text>}
      />
    );

    expect(getByText("Action")).toBeTruthy();
  });

  it("should apply custom style", () => {
    const customStyle = { marginBottom: 10 };
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Styled Item" style={customStyle} />
    );

    const pressable = UNSAFE_getByType(Pressable);
    const pressableProps = pressable.props as PressableProps;
    expect(typeof pressableProps.style).toBe("function");
    const styleFn = pressableProps.style as (state: { pressed: boolean }) => PressableStyle[];
    const resolvedStyle = styleFn({ pressed: false });
    expect(resolvedStyle).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render with all props combined", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
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

    expect(getByText("Complete Item")).toBeTruthy();
    expect(getByText("With all features")).toBeTruthy();
    expect(getByText("JS")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
  });

  it("should handle press in state", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedListItem title="Pressable Item" onPress={onPress} />
    );

    const pressable = UNSAFE_getByType(Pressable);
    expect(pressable.props.style).toBeDefined();
  });

  it("should render multiple list items", () => {
    const { getByText } = renderWithProviders(
      <>
        <ThemedListItem title="Item 1" />
        <ThemedListItem title="Item 2" />
        <ThemedListItem title="Item 3" />
      </>
    );

    expect(getByText("Item 1")).toBeTruthy();
    expect(getByText("Item 2")).toBeTruthy();
    expect(getByText("Item 3")).toBeTruthy();
  });

  it("should handle avatar with null imageUrl", () => {
    const { getByText } = renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "Alice Wonderland", imageUrl: null }}
      />
    );

    expect(getByText("AW")).toBeTruthy();
  });

  it("should handle single name for avatar initials", () => {
    const { getByText } = renderWithProviders(
      <ThemedListItem
        title="User Item"
        leftAvatar={{ name: "Alice" }}
      />
    );

    expect(getByText("A")).toBeTruthy();
  });
});
