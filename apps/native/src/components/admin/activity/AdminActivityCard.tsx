import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

type ActivityType = "submission" | "challenge_event" | "rank_change" | "custom" | "user_post";

interface AdminActivity {
  id: string;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: Date | string;
  admin?: { firstName?: string | null; lastName?: string | null } | null;
  submissionActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  rankChangeActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  userPost?: {
    author?: {
      group?: { name?: string | null } | null;
    } | null;
  } | null;
}

interface AdminActivityCardProps {
  item: AdminActivity;
  canDelete: boolean;
  isBusy: boolean;
  onEdit: (item: AdminActivity) => void;
  onPin: (item: AdminActivity) => void;
  onHide: (item: AdminActivity) => void;
  onDelete: (item: AdminActivity) => void;
}

const formatRelativeTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getActivityGroupName = (activity: AdminActivity) =>
  activity.submissionActivity?.group?.name?.trim() ??
  activity.rankChangeActivity?.group?.name?.trim() ??
  activity.userPost?.author?.group?.name?.trim() ??
  "";

export function AdminActivityCard({
  item,
  canDelete,
  isBusy,
  onEdit,
  onPin,
  onHide,
  onDelete,
}: AdminActivityCardProps) {
  const groupName = getActivityGroupName(item);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardType}>{item.activityType}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {groupName ? <Text style={styles.cardMeta}>Group: {groupName}</Text> : null}
          <Text style={styles.cardMeta}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <View style={styles.badges}>
          {item.isPinned ? (
            <View style={styles.badgePinned}>
              <Ionicons name="pin" size={12} color={colors.primary} />
              <Text style={styles.badgePinnedText}>Pinned</Text>
            </View>
          ) : null}
          {item.isHidden ? (
            <View style={styles.badgeHidden}>
              <Ionicons name="eye-off" size={12} color={colors.warning} />
              <Text style={styles.badgeHiddenText}>Hidden</Text>
            </View>
          ) : null}
        </View>
      </View>

      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}

      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImagePreview} />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(item)}
          disabled={isBusy}
        >
          <Ionicons name="create-outline" size={16} color={colors.white} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onPin(item)} disabled={isBusy}>
          <Ionicons name={item.isPinned ? "pin" : "pin-outline"} size={16} color={colors.primary} />
          <Text style={styles.actionText}>{item.isPinned ? "Unpin" : "Pin"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onHide(item)}
          disabled={isBusy}
        >
          <Ionicons name={item.isHidden ? "eye" : "eye-off"} size={16} color={colors.warning} />
          <Text style={styles.actionText}>{item.isHidden ? "Unhide" : "Hide"}</Text>
        </TouchableOpacity>

        {canDelete ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(item)}
            disabled={isBusy}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.cardDark,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cardType: {
    color: colors.primary,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: "700",
  },
  cardMeta: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginTop: 2,
  },
  badges: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  badgePinned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryOpacity20,
  },
  badgePinnedText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeHidden: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  badgeHiddenText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: "700",
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  cardImagePreview: {
    width: "100%",
    height: 140,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  actionText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: "600",
  },
});
