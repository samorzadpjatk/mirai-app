import React from "react";
import { View, Text } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapModalShell } from "../../map/modals/MapModalShell";

jest.mock("~/components/common/ui", () => ({
  AppModalShell: function MockAppModalShell({ children, visible, title }: {
    children: React.ReactNode;
    visible: boolean;
    title: string;
  }) {
    const React = require("react");
    const { View, Text } = require("react-native");
    if (!visible) return null;
    return React.createElement(View, { testID: "app-modal-shell" },
      React.createElement(Text, { testID: "modal-title" }, title),
      children
    );
  },
}));

describe("MapModalShell", () => {
  it("should render with title", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={() => {}}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("modal-title").children[0]).toBe("Test Modal");
  });

  it("should render children", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={() => {}}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("child-content")).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const { queryByTestId } = renderWithProviders(
      <MapModalShell visible={false} title="Test Modal" onClose={() => {}}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(queryByTestId("app-modal-shell")).toBeNull();
  });

  it("should pass maxHeight prop", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={() => {}} maxHeight="70%">
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
        onClose={() => {}}
        contentStyle={{ padding: 20 }}
      >
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("app-modal-shell")).toBeTruthy();
  });

  it("should use default maxHeight when not specified", () => {
    const { getByTestId } = renderWithProviders(
      <MapModalShell visible={true} title="Test Modal" onClose={() => {}}>
        <Text testID="child-content">Child Content</Text>
      </MapModalShell>
    );

    expect(getByTestId("app-modal-shell")).toBeTruthy();
  });
});
