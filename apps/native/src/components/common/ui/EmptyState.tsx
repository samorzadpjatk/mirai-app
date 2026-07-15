import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

// Ionicons icon names type
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: IoniconName;
  /** Icon size (default: 48) */
  iconSize?: number;
  /** Icon color (default: colors.textSecondary) */
  iconColor?: string;
  /** Title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Additional container style */
  style?: ViewStyle;
  /** Whether to add opacity to icon (default: 0.5) */
  iconOpacity?: number;
}

export function EmptyState({
  icon,
  iconSize = 48,
  iconColor = colors.textSecondary,
  title,
  subtitle,
  style,
  iconOpacity = 0.5,
}: EmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View testID="empty-state-container" style={[styles.emptyState, style]}>
      {icon ? (
        <View
          testID="empty-state-icon-wrapper"
          style={[styles.emptyIcon, { opacity: iconOpacity }]}
        >
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
      ) : null}
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptyStateText}>{subtitle}</Text> : null}
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 2,
    },
    emptyIcon: {
      marginBottom: spacing.lg,
    },
    emptyStateTitle: {
      fontSize: typography.xl,
      fontWeight: typography.bold,
      color: palette.white,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    emptyStateText: {
      fontSize: typography.base,
      color: palette.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
