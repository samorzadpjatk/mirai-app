import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName } from "@mirai-app/common/users";
import { Text, TouchableOpacity, View } from "react-native";
import type { Group } from "~/hooks/admin/useAdminCoins";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";

interface GroupCardProps {
  group: Group;
  onAddCoins: (group: Group) => void;
  onRemoveCoins: (group: Group) => void;
}

export function GroupCard({ group, onAddCoins, onRemoveCoins }: GroupCardProps) {
  const { palette } = useTripTheme();

  return (
    <View
      style={{
        backgroundColor: palette.cardDark,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.borderWhite5,
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
              color: palette.white,
              marginBottom: spacing.xs,
            }}
          >
            {group.name}
          </Text>
          {group.organizer && (
            <Text
              style={{
                fontSize: typography.sm,
                color: palette.textSecondary,
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
              backgroundColor: palette.accentMagenta,
            }}
          >
            <Ionicons name="cash" size={16} color={palette.white} />
            <Text
              style={{
                fontSize: typography.base,
                color: palette.white,
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
          <Ionicons name="people" size={14} color={palette.textSecondary} />
          <Text
            style={{
              fontSize: typography.sm,
              color: palette.textSecondary,
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
          <Ionicons name="add-circle" size={16} color={palette.white} />
          <Text
            style={{
              fontSize: typography.sm,
              color: palette.white,
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
          <Ionicons name="remove-circle" size={16} color={palette.white} />
          <Text
            style={{
              fontSize: typography.sm,
              color: palette.white,
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
