import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AdminAddFab } from "../../admin/common/AdminAddFab";

jest.mock("~/components/common/FloatingActionButton", () => ({
  FloatingActionButton: ({
    onPress,
    iconName,
    accessibilityLabel,
    disabled,
  }: {
    onPress: () => void;
    iconName: string;
    accessibilityLabel: string;
    disabled?: boolean;
  }) => {
    const { TouchableOpacity, Text } = jest.requireActual("react-native");
    return (
      <TouchableOpacity
        testID="fab-button"
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
      >
        <Text>{iconName}</Text>
      </TouchableOpacity>
    );
  },
}));

describe("AdminAddFab", () => {
  it("renders with required props", () => {
    const { getByTestId, getByLabelText } = renderWithProviders(
      <AdminAddFab onPress={jest.fn()} accessibilityLabel="Add new item" />,
    );

    expect(getByTestId("fab-button")).toBeTruthy();
    expect(getByLabelText("Add new item")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AdminAddFab onPress={onPress} accessibilityLabel="Add new item" />,
    );

    fireEvent.press(getByTestId("fab-button"));
    expect(onPress).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AdminAddFab onPress={onPress} accessibilityLabel="Add new item" disabled={true} />,
    );

    const button = getByTestId("fab-button");
    expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBe(true);
  });

  it("renders with custom position props", () => {
    const { getByTestId } = renderWithProviders(
      <AdminAddFab onPress={jest.fn()} accessibilityLabel="Add new item" bottom={120} right={30} />,
    );

    expect(getByTestId("fab-button")).toBeTruthy();
  });

  it("renders with custom style", () => {
    const { getByTestId } = renderWithProviders(
      <AdminAddFab
        onPress={jest.fn()}
        accessibilityLabel="Add new item"
        style={{ opacity: 0.5 }}
      />,
    );

    expect(getByTestId("fab-button")).toBeTruthy();
  });

  it("uses default position values", () => {
    const { getByTestId } = renderWithProviders(
      <AdminAddFab onPress={jest.fn()} accessibilityLabel="Add new item" />,
    );

    expect(getByTestId("fab-button")).toBeTruthy();
  });
});
