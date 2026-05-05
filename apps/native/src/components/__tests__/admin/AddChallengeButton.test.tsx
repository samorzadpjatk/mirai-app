import React from "react";
import { TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AddChallengeButton } from "../../admin/challenges/AddChallengeButton";

describe("AddChallengeButton", () => {
  it("renders with the default label", () => {
    const { getByText } = renderWithProviders(
      <AddChallengeButton onPress={jest.fn()} />
    );

    expect(getByText("Add New")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <AddChallengeButton onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalled();
  });
});
