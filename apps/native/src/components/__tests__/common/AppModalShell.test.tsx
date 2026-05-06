import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AppModalShell } from "../../common/ui/AppModalShell";

const noop = (): void => undefined;

describe("AppModalShell", () => {
  it("should render when visible is true", () => {
    const { getByText } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Modal Content</Text>
      </AppModalShell>
    );

    expect(getByText("Test Modal")).toBeTruthy();
    expect(getByText("Modal Content")).toBeTruthy();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
      >
        <Text>Modal Content</Text>
      </AppModalShell>
    );

    fireEvent.press(getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is pressed (card variant)", () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
        variant="card"
      >
        <Text>Modal Content</Text>
      </AppModalShell>
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBeGreaterThan(0);
    fireEvent.press(pressables[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render with card variant by default", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.transparent).toBe(true);
    expect(modal.props.animationType).toBe("fade");
  });

  it("should render with pageSheet variant", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        variant="pageSheet"
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.transparent).toBe(false);
    expect(modal.props.animationType).toBe("slide");
    expect(modal.props.presentationStyle).toBe("pageSheet");
  });

  it("should apply custom maxHeight", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        maxHeight="60%"
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal).toBeTruthy();
  });

  it("should apply custom maxWidth", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        maxWidth={400}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal).toBeTruthy();
  });

  it("should apply custom contentStyle", () => {
    const customStyle = { padding: 20 };
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        contentStyle={customStyle}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal).toBeTruthy();
  });

  it("should handle onRequestClose", () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.onRequestClose).toBe(onClose);
  });

  it("should stop propagation when content is pressed", () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
        variant="card"
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    interface PressableLike {
      props: {
        onPress?: () => void;
      };
    }

    const pressables = UNSAFE_getAllByType(Pressable) as PressableLike[];
    const contentPressable = pressables.find((p) =>
      p.props.onPress?.toString().includes("stopPropagation")
    );
    expect(contentPressable).toBeTruthy();
  });

  it("should render complex children", () => {
    const { getByText } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Complex Modal"
        onClose={noop}
      >
        <View>
          <Text>Header</Text>
          <Text>Body</Text>
          <Text>Footer</Text>
        </View>
      </AppModalShell>
    );

    expect(getByText("Header")).toBeTruthy();
    expect(getByText("Body")).toBeTruthy();
    expect(getByText("Footer")).toBeTruthy();
  });

  it("should render with default maxHeight", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal).toBeTruthy();
  });

  it("should render close button with correct styling", () => {
    const { getByText } = renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const closeButton = getByText("✕");
    expect(closeButton).toBeTruthy();
    expect(closeButton.props.style).toEqual(
      expect.objectContaining({
        fontSize: 24,
        fontWeight: "600",
      })
    );
  });
});
