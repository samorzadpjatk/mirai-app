import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet } from "react-native";
import { spacing } from "~/styles";

export interface FilterChipRowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  horizontalSpacing?: number;
}

/**
 * Simple horizontal stack for chips with default gap and right padding.
 */
export const FilterChipRow: React.FC<FilterChipRowProps> = ({
  children,
  style,
  horizontalSpacing,
}) => {
  return (
    <ScrollView
      testID="filter-chip-row"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        horizontalSpacing !== undefined && { gap: horizontalSpacing },
        style,
      ]}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
});
