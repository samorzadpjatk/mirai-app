import { screen, userEvent } from "@testing-library/react-native";
import { type ViewStyle } from "react-native";
import { FilterChip } from "../../common/ui/FilterChip";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface ChipStyle extends ViewStyle {
  borderColor?: string;
  backgroundColor?: string;
  opacity?: number;
  color?: string;
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
    renderWithProviders(
      <FilterChip label="Selected" selected={true} testID="filter-chip-selected" />,
    );

    const touchable = screen.getByTestId("filter-chip-selected");
    const style = touchable.props.style as ChipStyle;
    expect(style.borderColor).toEqual(expect.any(String));
    expect(style.backgroundColor).toEqual(expect.any(String));
  });

  it("should apply unselected style when selected is false", () => {
    renderWithProviders(
      <FilterChip label="Unselected" selected={false} testID="filter-chip-unselected" />,
    );

    const touchable = screen.getByTestId("filter-chip-unselected");
    const style = touchable.props.style as ChipStyle;
    expect(style.borderColor).toEqual(expect.any(String));
    expect(style.backgroundColor).toEqual(expect.any(String));
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
    renderWithProviders(
      <FilterChip
        label="Disabled"
        onPress={onPress}
        disabled={true}
        testID="filter-chip-disabled"
      />,
    );

    const touchable = screen.getByTestId("filter-chip-disabled");
    expect(touchable.props.accessibilityState?.disabled).toBe(true);
  });

  it("should apply disabled style when disabled", () => {
    renderWithProviders(
      <FilterChip label="Disabled" disabled={true} testID="filter-chip-disabled-style" />,
    );

    const touchable = screen.getByTestId("filter-chip-disabled-style");
    const style = touchable.props.style as ChipStyle;
    expect(style).toMatchObject({ opacity: 0.6 });
  });

  it("should apply custom style", () => {
    const customStyle = { marginRight: 10 };
    renderWithProviders(
      <FilterChip label="Styled" style={customStyle} testID="filter-chip-custom-style" />,
    );

    const touchable = screen.getByTestId("filter-chip-custom-style");
    expect(touchable.props.style).toMatchObject(customStyle);
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 16 };
    renderWithProviders(<FilterChip label="Styled Text" textStyle={customTextStyle} />);

    const text = screen.getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)]),
    );
  });

  it("should apply custom count pill style", () => {
    const customPillStyle = { backgroundColor: "red" };
    renderWithProviders(
      <FilterChip
        label="Items"
        count={5}
        countPillStyle={customPillStyle}
        testID="filter-chip-pill-style"
      />,
    );

    const touchable = screen.getByTestId("filter-chip-pill-style");
    expect(touchable).toBeTruthy();
  });

  it("should apply custom count text style", () => {
    const customCountTextStyle = { fontWeight: "bold" as const };
    renderWithProviders(
      <FilterChip label="Items" count={5} countTextStyle={customCountTextStyle} />,
    );

    const countText = screen.getByText("5");
    expect(countText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customCountTextStyle)]),
    );
  });

  it("should have correct accessibility role", () => {
    renderWithProviders(
      <FilterChip
        label="Accessible"
        accessibilityLabel="Filter by category"
        testID="filter-chip-accessible"
      />,
    );

    const touchable = screen.getByTestId("filter-chip-accessible");
    expect(touchable.props.accessibilityRole).toBe("button");
    expect(touchable.props.accessibilityLabel).toBe("Filter by category");
  });

  it("should use default accessibility label when not provided", () => {
    renderWithProviders(<FilterChip label="Filter" testID="filter-chip-default-a11y" />);

    const touchable = screen.getByTestId("filter-chip-default-a11y");
    expect(touchable.props.accessibilityLabel).toBeUndefined();
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
