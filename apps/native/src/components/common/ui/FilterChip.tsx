import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { TextStyle, ViewStyle } from "react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

export type FilterChipIcon = keyof typeof Ionicons.glyphMap;

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: FilterChipIcon;
  secondaryIcon?: FilterChipIcon;
  count?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  countPillStyle?: ViewStyle;
  countTextStyle?: TextStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  secondaryIcon,
  count,
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
  countPillStyle,
  countTextStyle,
}) => {
  const hasCount = typeof count === "number";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        style,
      ]}
    >
      <View style={styles.leftContent}>
        {icon ? (
          <Ionicons
            name={icon}
            size={14}
            color={selected ? colors.primary : colors.textSecondary}
          />
        ) : null}
        {secondaryIcon ? (
          <Ionicons
            name={secondaryIcon}
            size={14}
            color={selected ? colors.primary : colors.textSecondary}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            selected && styles.labelSelected,
            disabled && styles.labelDisabled,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </View>

      {hasCount ? (
        <View
          style={[
            styles.countPill,
            selected && styles.countPillSelected,
            countPillStyle,
          ]}
        >
          <Text
            style={[
              styles.countText,
              selected && styles.countTextSelected,
              disabled && styles.countTextDisabled,
              countTextStyle,
            ]}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDarkOpacity50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity20,
  },
  chipDisabled: {
    opacity: 0.6,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    textTransform: "none",
    letterSpacing: 0.4,
  },
  labelSelected: {
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
  countPill: {
    minWidth: 24,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDarkOpacity80,
    alignItems: "center",
    justifyContent: "center",
  },
  countPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity20,
  },
  countText: {
    color: colors.white,
    fontWeight: typography.bold,
    fontSize: typography.xs,
  },
  countTextSelected: {
    color: colors.primary,
  },
  countTextDisabled: {
    color: colors.textTertiary,
  },
});
