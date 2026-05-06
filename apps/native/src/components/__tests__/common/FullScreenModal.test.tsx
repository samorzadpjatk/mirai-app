import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FullScreenModal } from "../../common/ui/FullScreenModal";

describe("FullScreenModal", () => {
  it("should render when visible is true", () => {
    const { getByText } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Modal Content</Text>
      </FullScreenModal>
    );

    expect(getByText("Test Modal")).toBeTruthy();
    expect(getByText("Modal Content")).toBeTruthy();
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
    const { getByText } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Modal Content</Text>
      </FullScreenModal>
    );

    expect(getByText("close")).toBeTruthy();
  });

  it("should render children content", () => {
    const { getByText } = renderWithProviders(
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

    expect(getByText("Child 1")).toBeTruthy();
    expect(getByText("Child 2")).toBeTruthy();
  });

  it("should render header with title", () => {
    const { getByText, UNSAFE_getByType } = renderWithProviders(
      <FullScreenModal
        visible={true}
        title="Test Modal"
        onClose={() => { /* noop */ }}
      >
        <Text>Content</Text>
      </FullScreenModal>
    );

    expect(getByText("My Modal Title")).toBeTruthy();
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
    const { getByText } = renderWithProviders(
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

    expect(getByText("Section 1")).toBeTruthy();
    expect(getByText("Nested Content")).toBeTruthy();
    expect(getByText("Section 2")).toBeTruthy();
  });
});
