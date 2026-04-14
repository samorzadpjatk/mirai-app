import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView } from "react-native";

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
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: horizontalSpacing ?? 8,
          paddingRight: 16,
        },
        style,
      ]}
    >
      {children}
    </ScrollView>
  );
};
