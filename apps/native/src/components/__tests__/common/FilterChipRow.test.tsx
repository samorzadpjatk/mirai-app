import React from "react";
import { ScrollView, Text, View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { FilterChipRow } from "../../common/ui/FilterChipRow";
import { FilterChip } from "../../common/ui/FilterChip";

describe("FilterChipRow", () => {
  it("should render children", () => {
    const { getByText } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
        <FilterChip label="Chip 2" />
      </FilterChipRow>
    );

    expect(getByText("Chip 1")).toBeTruthy();
    expect(getByText("Chip 2")).toBeTruthy();
  });

  it("should render as horizontal ScrollView", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView).toBeTruthy();
    expect(scrollView.props.horizontal).toBe(true);
  });

  it("should hide horizontal scroll indicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false);
  });

  it("should apply default gap styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flexDirection: "row",
          alignItems: "center",
          gap: expect.any(Number),
          paddingRight: expect.any(Number),
        }),
      ])
    );
  });

  it("should apply custom horizontal spacing", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow horizontalSpacing={20}>
        <FilterChip label="Chip 1" />
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gap: 20 }),
      ])
    );
  });

  it("should apply custom style", () => {
    const customStyle = { marginTop: 10 };
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow style={customStyle}>
        <FilterChip label="Chip 1" />
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render multiple chips", () => {
    const { getByText } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="All" />
        <FilterChip label="Active" />
        <FilterChip label="Completed" />
        <FilterChip label="Archived" />
      </FilterChipRow>
    );

    expect(getByText("All")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
    expect(getByText("Completed")).toBeTruthy();
    expect(getByText("Archived")).toBeTruthy();
  });

  it("should render with single child", () => {
    const { getByText } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Single Chip" />
      </FilterChipRow>
    );

    expect(getByText("Single Chip")).toBeTruthy();
  });

  it("should render with mixed content", () => {
    const { getByText } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip" />
        <Text>Text Element</Text>
      </FilterChipRow>
    );

    expect(getByText("Chip")).toBeTruthy();
    expect(getByText("Text Element")).toBeTruthy();
  });

  it("should handle empty children gracefully", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow>
        <></>
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView).toBeTruthy();
  });

  it("should apply correct flex direction", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <FilterChipRow>
        <FilterChip label="Chip 1" />
      </FilterChipRow>
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    const contentStyle = scrollView.props.contentContainerStyle;
    const hasRowDirection = contentStyle.some(
      (s: Record<string, string>) => s?.flexDirection === "row"
    );
    expect(hasRowDirection).toBe(true);
  });
});
