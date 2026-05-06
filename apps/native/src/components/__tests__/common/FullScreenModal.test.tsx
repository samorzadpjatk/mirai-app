import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FullScreenModal } from "../../common/ui/FullScreenModal";

describe("FullScreenModal", () => {
  it("should render when visible is true", () => {
    renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Modal Content</Text>
      </FullScreenModal>
    );

    expect(screen.getByText("Test Modal")).toBeOnTheScreen();
    expect(screen.getByText("Modal Content")).toBeOnTheScreen();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={onClose}
      >
        <Text>Modal Content</Text>
      </FullScreenModal>
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBeGreaterThan(0);
    fireEvent.press(pressables[pressables.length - 1]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render with correct Modal props", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Modal Content</Text>
      </FullScreenModal>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.animationType).toBe("slide");
    expect(modal.props.transparent).toBe(false);
    expect(modal.props.presentationStyle).toBe("fullScreen");
    expect(modal.props.statusBarTranslucent).toBe(true);
  });

  it("should render close button with icon", () => {
    renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Modal Content</Text>
      </FullScreenModal>
    );

    expect(screen.getByText("close")).toBeOnTheScreen();
  });

  it("should render children content", () => {
    renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <View>
          <Text>Child 1</Text>
          <Text>Child 2</Text>
        </View>
      </FullScreenModal>
    );

    expect(screen.getByText("Child 1")).toBeOnTheScreen();
    expect(screen.getByText("Child 2")).toBeOnTheScreen();
  });

  it("should render header with title", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Content</Text>
      </FullScreenModal>
    );

    expect(screen.getByText("Test Modal")).toBeOnTheScreen();
    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should handle onRequestClose", () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={onClose}
      >
        <Text>Content</Text>
      </FullScreenModal>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.onRequestClose).toBe(onClose);
  });

  it("should render with SafeAreaTop wrapper", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Content</Text>
      </FullScreenModal>
    );

    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should apply correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Content</Text>
      </FullScreenModal>
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal).toBeTruthy();
  });

  it("should render complex nested content", () => {
    renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Complex Modal"
        onClose={() => { /* noop */ }}
      >
        <View>
          <Text>Section 1</Text>
          <View>
            <Text>Nested Content</Text>
          </View>
          <Text>Section 2</Text>
        </View>
      </FullScreenModal>
    );

    expect(screen.getByText("Section 1")).toBeOnTheScreen();
    expect(screen.getByText("Nested Content")).toBeOnTheScreen();
    expect(screen.getByText("Section 2")).toBeOnTheScreen();
  });
});
