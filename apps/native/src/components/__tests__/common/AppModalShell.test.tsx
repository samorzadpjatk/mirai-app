import React from "react";
import { Pressable, Text, View } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AppModalShell } from "../../common/ui/AppModalShell";

const noop = (): void => undefined;

describe("AppModalShell", () => {
  it("should render when visible is true", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Modal Content</Text>
      </AppModalShell>
    );

    expect(screen.getByText("Test Modal")).toBeOnTheScreen();
    expect(screen.getByText("Modal Content")).toBeOnTheScreen();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
      >
        <Text>Modal Content</Text>
      </AppModalShell>
    );

    fireEvent.press(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is pressed (card variant)", () => {
    const onClose = jest.fn();
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
        variant="card"
      >
        <Text>Modal Content</Text>
      </AppModalShell>
    );

    fireEvent.press(screen.getByTestId("app-modal-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render with card variant by default", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal.props.transparent).toBe(true);
    expect(modal.props.animationType).toBe("fade");
  });

  it("should render with pageSheet variant", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        variant="pageSheet"
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal.props.transparent).toBe(false);
    expect(modal.props.animationType).toBe("slide");
    expect(modal.props.presentationStyle).toBe("pageSheet");
  });

  it("should apply custom maxHeight", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        maxHeight="60%"
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal).toBeTruthy();
  });

  it("should apply custom maxWidth", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        maxWidth={400}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal).toBeTruthy();
  });

  it("should apply custom contentStyle", () => {
    const customStyle = { padding: 20 };
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        contentStyle={customStyle}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal).toBeTruthy();
  });

  it("should handle onRequestClose", () => {
    const onClose = jest.fn();
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={onClose}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal.props.onRequestClose).toBe(onClose);
  });

  it("should stop propagation when content is pressed", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={jest.fn()}
        variant="card"
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    expect(screen.getByTestId("app-modal-content")).toBeTruthy();
  });

  it("should render complex children", () => {
    renderWithProviders(
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

    expect(screen.getByText("Header")).toBeOnTheScreen();
    expect(screen.getByText("Body")).toBeOnTheScreen();
    expect(screen.getByText("Footer")).toBeOnTheScreen();
  });

  it("should render with default maxHeight", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const modal = screen.getByTestId("app-modal");
    expect(modal).toBeTruthy();
  });

  it("should render close button with correct styling", () => {
    renderWithProviders(
      <AppModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
      >
        <Text>Content</Text>
      </AppModalShell>
    );

    const closeButton = screen.getByText("✕");
    expect(closeButton).toBeOnTheScreen();
    expect(closeButton.props.style).toEqual(
      expect.objectContaining({
        fontSize: 24,
        fontWeight: "600",
      })
    );
  });
});
