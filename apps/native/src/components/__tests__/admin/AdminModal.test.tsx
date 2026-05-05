import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminModal, AdminModalButton } from "../../admin/AdminModal";

jest.mock("~/components/common/ui", () => ({
  AppModalShell: ({ children, visible, title, onClose }: any) => {
    const { Text, TouchableOpacity, View } = require("react-native");
    if (!visible) return null;
    return (
      <View>
        <Text>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        {children}
      </View>
    );
  },
}));

describe("AdminModal", () => {
  it("renders visible content", () => {
    const { getByText } = renderWithProviders(
      <AdminModal visible onClose={jest.fn()} title="Test Modal" actions={<Text>Actions</Text>}>
        <Text>Modal Content</Text>
      </AdminModal>
    );

    expect(getByText("Test Modal")).toBeTruthy();
    expect(getByText("Modal Content")).toBeTruthy();
    expect(getByText("Actions")).toBeTruthy();
  });

  it("hides content when not visible", () => {
    const { queryByText } = renderWithProviders(
      <AdminModal visible={false} onClose={jest.fn()} title="Test Modal">
        <Text>Modal Content</Text>
      </AdminModal>
    );

    expect(queryByText("Test Modal")).toBeNull();
    expect(queryByText("Modal Content")).toBeNull();
  });
});

describe("AdminModalButton", () => {
  it("calls onPress when enabled", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(<AdminModalButton title="Confirm" onPress={onPress} />);

    fireEvent.press(getByText("Confirm"));
    expect(onPress).toHaveBeenCalled();
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(<AdminModalButton title="Disabled" onPress={onPress} disabled />);

    expect(getByText("Disabled").parent).toBeTruthy();
    expect(getByText("Disabled").parent?.parent?.props.disabled ?? getByText("Disabled").parent?.props.disabled).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows a spinner when loading", () => {
    const { queryByText } = renderWithProviders(<AdminModalButton title="Loading" onPress={jest.fn()} loading />);

    expect(queryByText("Loading")).toBeNull();
  });
});
