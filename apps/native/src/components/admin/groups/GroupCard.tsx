import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName } from "@mirai-app/shared";
import { colors, spacing, borderRadius, typography } from "~/styles";
import type { Group } from "~/hooks/admin/useAdminCoins";

interface GroupCardProps {
  group: Group;
  onAddCoins: (group: Group) => void;
  onRemoveCoins: (group: Group) => void;
}

export function GroupCard({ group, onAddCoins, onRemoveCoins }: GroupCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.cardDark,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderWhite5,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.lg,
              fontWeight: typography.bold,
              color: colors.white,
              marginBottom: spacing.xs,
            }}
          >
            {group.name}
          </Text>
          {group.organizer && (
            <Text
              style={{
                fontSize: typography.sm,
                color: colors.textSecondary,
              }}
            >
              Organizer:{" "}
              {formatDisplayName(group.organizer.firstName, group.organizer.lastName) ??
                "Unknown User"}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
              gap: spacing.xs,
              backgroundColor: colors.accentMagenta,
            }}
          >
            <Ionicons name="cash" size={16} color={colors.white} />
            <Text
              style={{
                fontSize: typography.base,
                color: colors.white,
                fontWeight: typography.bold,
              }}
            >
              {group.coins}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          <Ionicons name="people" size={14} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: typography.sm,
              color: colors.textSecondary,
            }}
          >
            {group._count.participants} members
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            gap: spacing.xs,
            backgroundColor: colors.success,
          }}
          onPress={() => onAddCoins(group)}
        >
          <Ionicons name="add-circle" size={16} color={colors.white} />
          <Text
            style={{
              fontSize: typography.sm,
              color: colors.white,
              fontWeight: typography.medium,
            }}
          >
            Add Coins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            gap: spacing.xs,
            backgroundColor: colors.warning,
          }}
          onPress={() => onRemoveCoins(group)}
        >
          <Ionicons name="remove-circle" size={16} color={colors.white} />
          <Text
            style={{
              fontSize: typography.sm,
              color: colors.white,
              fontWeight: typography.medium,
            }}
          >
            Remove Coins
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
