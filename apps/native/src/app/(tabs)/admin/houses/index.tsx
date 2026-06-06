import { orpc } from "@mirai-app/orpc/client";
import { formatDisplayName, getInitials } from "@mirai-app/shared/users";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminSearchBar } from "~/components/admin/AdminSearchBar";
import { ErrorState } from "~/components/common/ui";
import { colors, spacing } from "~/styles";

function HouseCard({
  house,
}: {
  house: {
    houseNumber: string;
    occupants: {
      id: string;
      firstName: string;
      lastName: string;
      wristNumber: string | null;
    }[];
  };
}) {
  return (
    <View style={styles.houseCard}>
      <View style={styles.houseHeader}>
        <Text style={styles.houseTitle}>House {house.houseNumber}</Text>
        <Text style={styles.houseSubtitle}>{house.occupants.length} occupants</Text>
      </View>
      <View style={styles.occupantList}>
        {house.occupants.map((occupant) => (
          <View key={occupant.id} style={styles.occupantRow}>
            <View style={styles.occupantAvatar}>
              <Text style={styles.occupantAvatarText}>
                {getInitials(occupant.firstName, occupant.lastName)}
              </Text>
            </View>
            <View style={styles.occupantInfo}>
              <Text style={styles.occupantName}>
                {formatDisplayName(occupant.firstName, occupant.lastName) ?? "Unknown User"}
              </Text>
              {occupant.wristNumber ? (
                <Text style={styles.occupantWristNumber}>Wrist #{occupant.wristNumber}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AdminHousesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: housesData,
    isLoading: housesLoading,
    isError: isHousesError,
    error: housesError,
  } = useQuery({
    ...orpc.user.getTripHouses.queryOptions({
      input: { tripId: tripId ?? "" },
    }),
    enabled: !!tripId,
  });

  const filteredHouses = useCallback(() => {
    if (!housesData?.houses) return [];
    if (!searchTerm.trim()) return housesData.houses;
    return housesData.houses.filter((house) =>
      house.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [housesData, searchTerm])();

  const unassigned = housesData?.unassigned ?? [];

  if (!tripId) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.backgroundDark, paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Trip ID is required" />
      </View>
    );
  }

  if (housesLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading houses...</Text>
        </View>
      </View>
    );
  }

  if (isHousesError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ErrorState
          title="Failed to load houses"
          message={housesError?.message ?? "Something went wrong"}
        />
      </View>
    );
  }

  const fieldOptions = [{ key: "houseNumber", label: "House Number" }];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: spacing.xl,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Houses" subtitle="Manage house assignments" />

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedField="houseNumber"
        onFieldChange={() => {}}
        fields={fieldOptions}
      />

      <FlatList
        data={filteredHouses}
        renderItem={({ item }) => <HouseCard house={item} />}
        keyExtractor={(item) => item.houseNumber}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No houses found</Text>
          </View>
        }
        ListFooterComponent={
          unassigned.length > 0 ? (
            <View style={styles.unassignedSection}>
              <Text style={styles.unassignedTitle}>Unassigned Users</Text>
              <Text style={styles.unassignedSubtitle}>
                {unassigned.length} users without a house
              </Text>
              <View style={styles.occupantList}>
                {unassigned.map((user) => (
                  <View key={user.id} style={styles.occupantRow}>
                    <View style={styles.occupantAvatar}>
                      <Text style={styles.occupantAvatarText}>
                        {getInitials(user.firstName, user.lastName)}
                      </Text>
                    </View>
                    <View style={styles.occupantInfo}>
                      <Text style={styles.occupantName}>
                        {formatDisplayName(user.firstName, user.lastName) ?? "Unknown User"}
                      </Text>
                      {user.wristNumber ? (
                        <Text style={styles.occupantWristNumber}>Wrist #{user.wristNumber}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  houseCard: {
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  houseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  houseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  houseSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  occupantList: {
    gap: spacing.sm,
  },
  occupantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  occupantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  occupantAvatarText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.white,
  },
  occupantInfo: {
    flex: 1,
  },
  occupantName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  occupantWristNumber: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  unassignedSection: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
  },
  unassignedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  unassignedSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
} as const;
