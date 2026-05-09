import { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "~/styles";
import { UserAvatar } from "~/components/map/ui/UserAvatar";

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
  const isPressable = typeof onPress === "function";

  return (
    <Pressable
      testID="themed-list-item-pressable"
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
          <View style={styles.avatarWrapper}>
            <UserAvatar
              imageUrl={leftAvatar.imageUrl ?? null}
              name={leftAvatar.name}
              size={48}
            />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightElement}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryOpacity10,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemBordered: {
    borderColor: colors.borderDark,
  },
  itemSelected: {
    backgroundColor: colors.primaryOpacity10,
    borderColor: colors.primary,
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
    borderColor: colors.primaryOpacity30,
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
    color: colors.textSecondary,
    marginTop: 2,
  },
});
