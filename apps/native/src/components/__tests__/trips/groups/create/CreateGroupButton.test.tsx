import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { CreateGroupButton } from "../../../../trips/groups/create/CreateGroupButton";

describe("CreateGroupButton", () => {
  it("should render with 'Create Group' label", () => {
    const { getByText } = renderWithProviders(
      <CreateGroupButton isSubmitting={false} onPress={() => {}} />
    );

    expect(getByText("Create Group")).toBeTruthy();
  });

  it("should call onPress when pressed and not submitting", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <CreateGroupButton isSubmitting={false} onPress={onPress} />
    );

    fireEvent.press(getByText("Create Group"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should show loading indicator when isSubmitting is true", () => {
    const { queryByText, UNSAFE_getByType } = renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={() => {}} />
    );

    expect(queryByText("Create Group")).toBeNull();
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should be disabled when isSubmitting is true", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should not call onPress when button is disabled during submission", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });

  it("should enable button when isSubmitting changes from true to false", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType, rerender } = renderWithProviders(
      <CreateGroupButton isSubmitting={true} onPress={onPress} />
    );

    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);

    rerender(
      <CreateGroupButton isSubmitting={false} onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
