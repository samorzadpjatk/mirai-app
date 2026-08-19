import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

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
  const styles = useThemedStyles(makeStyles);
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

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    option: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.borderDark,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: "center",
    },
    optionSelected: {
      backgroundColor: palette.primaryOpacity10,
      borderColor: palette.primary,
    },
    optionDisabled: {
      opacity: 0.5,
    },
    optionText: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      fontWeight: typography.medium,
    },
    optionTextSelected: {
      color: palette.primary,
      fontWeight: typography.semibold,
    },
    optionTextDisabled: {
      color: palette.textTertiary,
    },
  });
}
