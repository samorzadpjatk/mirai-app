import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SegmentedOption } from "../../common/ui/SegmentedOption";

describe("SegmentedOption", () => {
  it("should render with label", () => {
    const { getByText } = renderWithProviders(
      <SegmentedOption label="Option 1" selected={false} onPress={() => {}} />
    );

    expect(getByText("Option 1")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <SegmentedOption label="Option 1" selected={false} onPress={onPress} />
    );

    fireEvent.press(getByText("Option 1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render selected and custom-styled options", () => {
    const { getByText } = renderWithProviders(
      <>
        <SegmentedOption label="Selected" selected onPress={() => {}} />
        <SegmentedOption
          label="With Custom Content"
          selected={false}
          onPress={() => {}}
          style={{ marginHorizontal: 10 }}
        />
        <Text>Extra</Text>
      </>
    );

    expect(getByText("Selected")).toBeTruthy();
    expect(getByText("With Custom Content")).toBeTruthy();
    expect(getByText("Extra")).toBeTruthy();
  });
});
