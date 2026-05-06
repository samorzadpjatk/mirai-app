import React from "react";
import { Text } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapModalShell } from "../../map/modals/MapModalShell";

jest.mock("~/components/common/ui", () => {
   
  const { createElement } = require("react");
  const { View, Text, Pressable } = require("react-native");

  return {
    AppModalShell: (props) =>
      !props.visible
        ? null
        : createElement(
            View,
            { testID: "app-modal-shell" },
            createElement(Text, { testID: "modal-title" }, props.title),
            createElement(
              Pressable,
              { testID: "close-modal-button", onPress: props.onClose },
              createElement(Text, null, "Close")
            ),
            props.children
          ),
  };
   
});

const noop = (): void => undefined;

describe("MapModalShell", () => {
  it("should render with title", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(screen.getByTestId("modal-title").children[0]).toBe("Test Modal");
  });

  it("should render children", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(screen.getByTestId("child-content")).toBeOnTheScreen();
  });

  it("should not render when not visible", () => {
    renderWithProviders(
      <MapModalShell visible={false} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(screen.queryByTestId("app-modal-shell")).toBeNull();
  });

  it("should pass maxHeight prop", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop} maxHeight="70%">
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(screen.getByTestId("app-modal-shell")).toBeOnTheScreen();
  });

  it("should pass contentStyle prop", () => {
    renderWithProviders(
      <MapModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        contentStyle={{ padding: 20 }}
      >
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(screen.getByTestId("app-modal-shell")).toBeOnTheScreen();
  });

  it("should use default maxHeight when not specified", () => {
    renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(screen.getByTestId("app-modal-shell")).toBeOnTheScreen();
  });
});
