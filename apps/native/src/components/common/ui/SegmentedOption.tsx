import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface SegmentedOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
}

export function SegmentedOption({
  label,
  selected,
  onPress,
  style,
  disabled = false,
  testID = `segmented-option-${label}`,
}: SegmentedOptionProps) {
  return (
    <Pressable
      testID={testID}
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.optionText,
          selected && styles.optionTextSelected,
          disabled && styles.optionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  optionSelected: {
    backgroundColor: colors.primaryOpacity10,
    borderColor: colors.primary,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  optionTextDisabled: {
    color: colors.textTertiary,
  },
});
