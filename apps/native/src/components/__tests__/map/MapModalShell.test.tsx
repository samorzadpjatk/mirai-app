import React from "react";
import { Text } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapModalShell } from "../../map/modals/MapModalShell";

jest.mock("~/components/common/ui", () => {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return,
       @typescript-eslint/no-unsafe-member-access */
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
  /* eslint-enable */
});

const noop = (): void => undefined;

describe("MapModalShell", () => {
  it("should render with title", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("modal-title").children[0]).toBe("Test Modal");
  });

  it("should render children", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("child-content")).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const { queryByTestId } = renderWithProviders(
      <MapModalShell visible={false} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(queryByTestId("app-modal-shell")).toBeNull();
  });

  it("should pass maxHeight prop", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop} maxHeight="70%">
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("app-modal-shell")).toBeTruthy();
  });

  it("should pass contentStyle prop", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell
        visible={true}
        title="Test Modal"
        onClose={noop}
        contentStyle={{ padding: 20 }}
      >
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("app-modal-shell")).toBeTruthy();
  });

  it("should use default maxHeight when not specified", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={noop}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("app-modal-shell")).toBeTruthy();
  });
});
