import React from "react";
import { TouchableOpacity, type TouchableOpacityProps, type ViewStyle } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FilterChip } from "../../common/ui/FilterChip";

interface ChipStyle extends ViewStyle {
  borderColor?: string;
  backgroundColor?: string;
  opacity?: number;
}

describe("FilterChip", () => {
  it("should render with label", () => {
    renderWithProviders(<FilterChip label="All" />);

    expect(screen.getByText("All")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<FilterChip label="Filter" onPress={onPress} />);

    await user.press(screen.getByText("Filter"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should apply selected style when selected is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Selected" selected={true} />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    const styles = touchableProps.style as ChipStyle[];
    const styleObj = styles[0]!;
    expect(styleObj.borderColor).toEqual(expect.any(String));
    expect(styleObj.backgroundColor).toEqual(expect.any(String));
  });

  it("should apply unselected style when selected is false", () => {
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Unselected" selected={false} />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    const styles = touchableProps.style as ChipStyle[];
    const styleObj = styles[0]!;
    expect(styleObj.borderColor).toEqual(expect.any(String));
    expect(styleObj.backgroundColor).toEqual(expect.any(String));
  });

  it("should render icon when provided", () => {
    renderWithProviders(<FilterChip label="Filter" icon="filter" />);

    expect(screen.getByText("filter")).toBeOnTheScreen();
  });

  it("should render secondary icon when provided", () => {
    renderWithProviders(<FilterChip label="Filter" icon="filter" secondaryIcon="chevron-down" />);

    expect(screen.getByText("filter")).toBeOnTheScreen();
    expect(screen.getByText("chevron-down")).toBeOnTheScreen();
  });

  it("should render count pill when count is provided", () => {
    renderWithProviders(<FilterChip label="Items" count={5} />);

    expect(screen.getByText("5")).toBeOnTheScreen();
  });

  it("should not render count pill when count is not provided", () => {
    renderWithProviders(<FilterChip label="Items" />);

    expect(screen.queryByText("5")).toBeNull();
  });

  it("should apply selected count pill style when selected", () => {
    renderWithProviders(<FilterChip label="Items" count={5} selected={true} />);

    const countText = screen.getByText("5");
    const countTextStyle = countText.props.style as ChipStyle[];
    const styleObj = countTextStyle[0]!;
    expect(styleObj.color).toEqual(expect.any(String));
  });

  it("should be disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Disabled" onPress={onPress} disabled={true} />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.disabled).toBe(true);
  });

  it("should apply disabled style when disabled", () => {
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Disabled" disabled={true} />);

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
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Styled" style={customStyle} />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 16 };
    renderWithProviders(<FilterChip label="Styled Text" textStyle={customTextStyle} />);

    const text = screen.getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)])
    );
  });

  it("should apply custom count pill style", () => {
    const customPillStyle = { backgroundColor: "red" };
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Items" count={5} countPillStyle={customPillStyle} />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    expect(touchable).toBeTruthy();
  });

  it("should apply custom count text style", () => {
    const customCountTextStyle = { fontWeight: "bold" };
    renderWithProviders(<FilterChip label="Items" count={5} countTextStyle={customCountTextStyle} />);

    const countText = screen.getByText("5");
    expect(countText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customCountTextStyle)])
    );
  });

  it("should have correct accessibility role", () => {
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Accessible" accessibilityLabel="Filter by category" />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.accessibilityRole).toBe("button");
    expect(touchableProps.accessibilityLabel).toBe("Filter by category");
  });

  it("should use default accessibility label when not provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(<FilterChip label="Filter" />);

    const touchable = UNSAFE_getByType(TouchableOpacity);
    const touchableProps = touchable.props as TouchableOpacityProps;
    expect(touchableProps.accessibilityLabel).toBeUndefined();
  });

  it("should handle zero count", () => {
    renderWithProviders(<FilterChip label="Items" count={0} />);

    expect(screen.getByText("0")).toBeOnTheScreen();
  });

  it("should handle large count numbers", () => {
    renderWithProviders(<FilterChip label="Items" count={999} />);

    expect(screen.getByText("999")).toBeOnTheScreen();
  });
});
