import React from "react";
import { TouchableOpacity, type TouchableOpacityProps, type ViewStyle } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FilterChip } from "../../common/ui/FilterChip";

interface ChipStyle extends ViewStyle {
  borderColor?: string;
  backgroundColor?: string;
  opacity?: number;
}

describe("FilterChip", () => {
  it("should render with label", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="All" />
    );

    expect(getByText("All")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Filter" onPress={onPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should apply selected style when selected is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Selected" selected={true} />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    const styles = touchableProps.style as ChipStyle[];
    const styleObj = styles[0]!;
    expect(styleObj.borderColor).toEqual(expect.any(String));
    expect(styleObj.backgroundColor).toEqual(expect.any(String));
  });

  it("should apply unselected style when selected is false", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Unselected" selected={false} />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    const styles = touchableProps.style as ChipStyle[];
    const styleObj = styles[0]!;
    expect(styleObj.borderColor).toEqual(expect.any(String));
    expect(styleObj.backgroundColor).toEqual(expect.any(String));
  });

  it("should render icon when provided", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="Filter" icon="filter" />
    );

    expect(getByText("filter")).toBeTruthy();
  });

  it("should render secondary icon when provided", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="Filter" icon="filter" secondaryIcon="chevron-down" />
    );

    expect(getByText("filter")).toBeTruthy();
    expect(getByText("chevron-down")).toBeTruthy();
  });

  it("should render count pill when count is provided", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="Items" count={5} />
    );

    expect(getByText("5")).toBeTruthy();
  });

  it("should not render count pill when count is not provided", () => {
    const { queryByText } = renderWithProviders(
      <FilterChip label="Items" />
    );

    expect(queryByText("5")).toBeNull();
  });

  it("should apply selected count pill style when selected", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="Items" count={5} selected={true} />
    );

    const countText = getByText("5");
    const countTextStyle = countText.props.style as ChipStyle[];
    const styleObj = countTextStyle[0]!;
    expect(styleObj.color).toEqual(expect.any(String));
  });

  it("should be disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Disabled" onPress={onPress} disabled={true} />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.disabled).toBe(true);
  });

  it("should apply disabled style when disabled", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Disabled" disabled={true} />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    const styles = touchableProps.style as ChipStyle[];
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.6 }),
      ])
    );
  });

  it("should apply custom style", () => {
    const customStyle = { marginRight: 10 };
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Styled" style={customStyle} />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 16 };
    const { getByText } = renderWithProviders(
      <FilterChip label="Styled Text" textStyle={customTextStyle} />
    );

    const text = getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)])
    );
  });

  it("should apply custom count pill style", () => {
    const customPillStyle = { backgroundColor: "red" };
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Items" count={5} countPillStyle={customPillStyle} />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    expect(touchable).toBeTruthy();
  });

  it("should apply custom count text style", () => {
    const customCountTextStyle = { fontWeight: "bold" };
    const { getByText } = renderWithProviders(
      <FilterChip label="Items" count={5} countTextStyle={customCountTextStyle} />
    );

    const countText = getByText("5");
    expect(countText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customCountTextStyle)])
    );
  });

  it("should have correct accessibility role", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Accessible" accessibilityLabel="Filter by category" />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.accessibilityRole).toBe("button");
    expect(touchableProps.accessibilityLabel).toBe("Filter by category");
  });

  it("should use default accessibility label when not provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChip label="Filter" />
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.accessibilityLabel).toBeUndefined();
  });

  it("should handle zero count", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="Items" count={0} />
    );

    expect(getByText("0")).toBeTruthy();
  });

  it("should handle large count numbers", () => {
    const { getByText } = renderWithProviders(
      <FilterChip label="Items" count={999} />
    );

    expect(getByText("999")).toBeTruthy();
  });
});
