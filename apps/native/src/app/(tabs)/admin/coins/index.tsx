import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { GroupCard } from "~/components/admin/groups/GroupCard";
import { Skeleton } from "~/components/ui/Skeleton";
import { useAdminCoins } from "~/hooks/admin/useAdminCoins";
import type { Group } from "~/hooks/admin/useAdminCoins";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";

export default function AdminCoinsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTripTheme();

  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [searchTerm, setSearchTerm] = useState("");

  const { groups, groupsLoading } = useAdminCoins(tripId ?? "");

  const filteredGroups = useMemo(() => {
    return (
      groups?.filter((group) => {
        const organizerName = [group.organizer?.firstName, group.organizer?.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          organizerName.includes(searchTerm.toLowerCase())
        );
      }) || []
    );
  }, [groups, searchTerm]);

  const stats = useMemo(() => {
    const totalCoins = groups?.reduce((sum, group) => sum + group.coins, 0) || 0;
    const totalGroups = groups?.length || 0;
    const avgCoinsPerGroup = totalGroups > 0 ? Math.round(totalCoins / totalGroups) : 0;

    return {
      totalCoins,
      totalGroups,
      avgCoinsPerGroup,
    };
  }, [groups]);

  const navigateToAddCoins = useCallback(
    (group: Group) => {
      if (!tripId) return;
      router.push({
        pathname: "/admin/coins/add",
        params: {
          tripId,
          groupId: group.id,
          groupName: group.name,
          groupCoins: String(group.coins),
        },
      });
    },
    [router, tripId],
  );

  const navigateToRemoveCoins = useCallback(
    (group: Group) => {
      if (!tripId) return;
      router.push({
        pathname: "/admin/coins/remove",
        params: {
          tripId,
          groupId: group.id,
          groupName: group.name,
          groupCoins: String(group.coins),
        },
      });
    },
    [router, tripId],
  );

  const renderGroup = useCallback(
    ({ item }: { item: Group }) => {
      return (
        <GroupCard
          group={item}
          onAddCoins={navigateToAddCoins}
          onRemoveCoins={navigateToRemoveCoins}
        />
      );
    },
    [navigateToAddCoins, navigateToRemoveCoins],
  );

  if (!tripId) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.backgroundDark, paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Trip ID is required" />
      </View>
    );
  }

  const renderStats = () => (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: palette.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderWhite5,
        }}
      >
        <Ionicons name="cash" size={24} color={palette.accentMagenta} />
        <Text
          style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {stats.totalCoins}
        </Text>
        <Text
          style={{
            fontSize: typography.sm,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Total Coins
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: palette.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderWhite5,
        }}
      >
        <Ionicons name="people-circle" size={24} color={palette.primary} />
        <Text
          style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {stats.totalGroups}
        </Text>
        <Text
          style={{
            fontSize: typography.sm,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Total Groups
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: palette.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderWhite5,
        }}
      >
        <Ionicons name="calculator" size={24} color={colors.warning} />
        <Text
          style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {stats.avgCoinsPerGroup}
        </Text>
        <Text
          style={{
            fontSize: typography.sm,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Avg Coins/Group
        </Text>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: palette.cardDark,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: palette.borderDark,
        }}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            fontSize: typography.base,
            color: colors.white,
          }}
          placeholder="Search groups..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.backgroundDark,
          paddingTop: spacing.xl,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Coins Management" subtitle="Manage group coins and transactions" />

      {renderStats()}
      {renderSearchBar()}

      {groupsLoading ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Skeleton.Group testID="coins-loading-skeleton">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows
                key={`coin-group-skeleton-${index}`}
                variant="box"
                width="100%"
                height={80}
              />
            ))}
          </Skeleton.Group>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
              <Ionicons name="cash" size={48} color={colors.textSecondary} />
              <Text
                style={{
                  marginTop: spacing.md,
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {searchTerm ? "No groups found" : "No groups available"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
