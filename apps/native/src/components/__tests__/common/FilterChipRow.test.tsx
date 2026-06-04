import { screen, userEvent } from "@testing-library/react-native";
import { type ScrollViewProps, Text, type ViewStyle } from "react-native";
import { FilterChip } from "../../common/ui/FilterChip";
import { FilterChipRow } from "../../common/ui/FilterChipRow";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface ContentContainerStyle extends ViewStyle {
  flexDirection?: "row" | "column";
  alignItems?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline";
  gap?: number;
  paddingRight?: number;
}

describe("FilterChipRow", () => {
  it("should render children", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
        <FilterChip label="Chip 2" />
      </FilterChipRow>,
    );

    expect(screen.getByText("Chip 1")).toBeOnTheScreen();
    expect(screen.getByText("Chip 2")).toBeOnTheScreen();
  });

  it("should render as horizontal ScrollView", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    expect(scrollView).toBeOnTheScreen();
    expect(scrollView.props.horizontal).toBe(true);
  });

  it("should hide horizontal scroll indicator", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false);
  });

  it("should apply default gap styling", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    const scrollViewProps = scrollView.props as ScrollViewProps;
    const contentContainerStyle = scrollViewProps.contentContainerStyle as ContentContainerStyle[];
    const styleObj = contentContainerStyle[0]!;
    expect(styleObj.flexDirection).toBe("row");
    expect(styleObj.alignItems).toBe("center");
    expect(styleObj.gap).toEqual(expect.any(Number));
    expect(styleObj.paddingRight).toEqual(expect.any(Number));
  });

  it("should apply custom horizontal spacing", () => {
    renderWithProviders(
      <FilterChipRow horizontalSpacing={20}>
        <FilterChip label="Chip 1" />
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ gap: 20 })]),
    );
  });

  it("should apply custom style", () => {
    const customStyle = { marginTop: 10 };
    renderWithProviders(
      <FilterChipRow style={customStyle}>
        <FilterChip label="Chip 1" />
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)]),
    );
  });

  it("should render multiple chips", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="All" />
        <FilterChip label="Active" />
        <FilterChip label="Completed" />
        <FilterChip label="Archived" />
      </FilterChipRow>,
    );

    expect(screen.getByText("All")).toBeOnTheScreen();
    expect(screen.getByText("Active")).toBeOnTheScreen();
    expect(screen.getByText("Completed")).toBeOnTheScreen();
    expect(screen.getByText("Archived")).toBeOnTheScreen();
  });

  it("should render with single child", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Single Chip" />
      </FilterChipRow>,
    );

    expect(screen.getByText("Single Chip")).toBeOnTheScreen();
  });

  it("should render with mixed content", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip" />
        <Text>Text Element</Text>
      </FilterChipRow>,
    );

    expect(screen.getByText("Chip")).toBeOnTheScreen();
    expect(screen.getByText("Text Element")).toBeOnTheScreen();
  });

  it("should allow pressing a chip", async () => {
    const user = userEvent.setup();
    const handlePress = jest.fn();

    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" onPress={handlePress} />
      </FilterChipRow>,
    );

    await user.press(screen.getByText("Chip 1"));

    expect(handlePress).toHaveBeenCalled();
  });

  it("should handle empty children gracefully", () => {
    renderWithProviders(
      <FilterChipRow>
        <></>
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    expect(scrollView).toBeTruthy();
  });

  it("should apply correct flex direction", () => {
    renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>,
    );

    const scrollView = screen.getByTestId("filter-chip-row");
    const scrollViewProps = scrollView.props as ScrollViewProps;
    const contentStyle = scrollViewProps.contentContainerStyle as ContentContainerStyle[];
    const hasRowDirection = contentStyle.some(
      (s: ContentContainerStyle) => s?.flexDirection === "row",
    );
    expect(hasRowDirection).toBe(true);
  });
});
