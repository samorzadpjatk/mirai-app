import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { UserAvatar } from "~/components/map/ui/UserAvatar";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface ThemedListItemProps {
  title: string;
  subtitle?: string;
  leftAvatar?: {
    name: string;
    imageUrl?: string | null;
  };
  rightElement?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ThemedListItem({
  title,
  subtitle,
  leftAvatar,
  rightElement,
  onPress,
  disabled = false,
  selected = false,
  bordered = false,
  style,
}: ThemedListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const isPressable = typeof onPress === "function";

  return (
    <Pressable
      testID="themed-list-item"
      style={({ pressed }) => [
        styles.item,
        bordered && styles.itemBordered,
        selected && styles.itemSelected,
        isPressable && pressed && !disabled && styles.itemPressed,
        style,
      ]}
      onPress={onPress}
      disabled={!isPressable || disabled}
    >
      <View style={styles.content}>
        {leftAvatar && (
          <View testID="item-avatar" style={styles.avatarWrapper}>
            <UserAvatar imageUrl={leftAvatar.imageUrl ?? null} name={leftAvatar.name} size={48} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text testID="item-title" style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text testID="item-subtitle" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightElement}
      </View>
    </Pressable>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: palette.primaryOpacity10,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: "transparent",
    },
    itemBordered: {
      borderColor: palette.borderDark,
    },
    itemSelected: {
      backgroundColor: palette.primaryOpacity10,
      borderColor: palette.primary,
    },
    itemPressed: {
      opacity: 0.8,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      flex: 1,
    },
    avatarWrapper: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: palette.primaryOpacity30,
      overflow: "hidden",
      backgroundColor: colors.backgroundDark,
      padding: 2,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: typography.base,
      fontWeight: typography.semibold,
      color: colors.white,
    },
    subtitle: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      marginTop: 2,
    },
  });
}
