import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function AdminHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
}: AdminHeaderProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity
            testID="back-button"
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={palette.white} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightComponent ? <View style={styles.headerRight}>{rightComponent}</View> : null}
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      minHeight: 60,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 0,
    },
    backButton: {
      marginRight: spacing.md,
      padding: spacing.xs,
    },
    title: {
      fontSize: typography.xl,
      fontWeight: typography.bold,
      color: palette.white,
      flexShrink: 1,
    },
    subtitle: {
      fontSize: typography.base,
      color: palette.textSecondary,
      marginTop: spacing.xs,
    },
  });
}
