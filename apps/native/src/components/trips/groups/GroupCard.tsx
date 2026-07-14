import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import type { GroupListItem } from "./types";

interface GroupCardProps {
  group: GroupListItem;
  onPress: (group: GroupListItem) => void;
  isMyGroup?: boolean;
}

export function GroupCard({ group, onPress, isMyGroup = false }: GroupCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <TouchableOpacity
      testID="group-card"
      style={[styles.groupCard, isMyGroup ? styles.groupCardMine : null]}
      activeOpacity={0.8}
      onPress={() => onPress(group)}
      aria-label={`Group ${group.name}${isMyGroup ? " (Your group)" : ""}`}
    >
      <WoodTexture radius={borderRadius.xl} />
      <View style={styles.groupImageContainer}>
        {group.image ? (
          <CachedImage
            testID="group-image"
            source={{ uri: group.image }}
            style={styles.groupImage}
            contentFit="cover"
          />
        ) : (
          <View testID="image-placeholder" style={styles.groupImagePlaceholder}>
            <Ionicons name="images-outline" size={20} color={palette.primary} />
          </View>
        )}
      </View>

      <View style={styles.groupInfo}>
        {isMyGroup ? (
          <View style={styles.myGroupBadge}>
            <Text style={styles.myGroupBadgeText}>Your group</Text>
          </View>
        ) : null}
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupCode}>{group.code}</Text>
      </View>

      <View style={styles.groupStats}>
        <Text style={styles.groupMemberCount}>{group.participantCount}</Text>
        <Text style={styles.groupMemberLabel}>MEMBERS</Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    groupCard: {
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
    },
    groupCardMine: {
      borderColor: palette.primary,
      backgroundColor: palette.primaryOpacity10,
    },
    groupImageContainer: {
      position: "relative",
    },
    groupImage: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    groupImagePlaceholder: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      backgroundColor: "rgba(39, 41, 53, 0.8)",
      alignItems: "center",
      justifyContent: "center",
    },
    groupInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    myGroupBadge: {
      alignSelf: "flex-start",
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: palette.primaryOpacity20,
      borderWidth: 1,
      borderColor: palette.primaryOpacity30,
    },
    myGroupBadgeText: {
      fontSize: typography.xs,
      fontWeight: typography.bold,
      color: palette.primary,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    groupName: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
      letterSpacing: -0.5,
    },
    groupCode: {
      fontSize: typography.sm,
      fontWeight: typography.medium,
      color: colors.textMuted,
    },
    groupStats: {
      alignItems: "flex-end",
    },
    groupMemberCount: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
    },
    groupMemberLabel: {
      fontSize: typography.xs,
      fontWeight: typography.bold,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
  });
