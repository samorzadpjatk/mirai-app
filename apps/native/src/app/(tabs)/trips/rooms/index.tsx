import { formatDisplayName, getInitials } from "@mirai-app/common/users";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import LoadingScreen from "~/components/LoadingScreen";
import { WoodTexture } from "~/components/common/WoodTexture";
import { EmptyState } from "~/components/common/ui";
import {
  type GroupMember,
  GroupMemberList,
} from "~/components/trips/groups/details/GroupMemberList";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

export default function RoomsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const { data, isLoading } = useQuery(
    orpc.room.getAll.queryOptions({
      input: { tripId: tripId ?? "" },
      enabled: Boolean(tripId),
    }),
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  const rooms = data?.rooms ?? [];

  if (rooms.length === 0) {
    return (
      <View style={styles.emptyWrapper}>
        <EmptyState
          icon="bed-outline"
          title="No rooms"
          subtitle="No rooms have been created for this trip yet."
        />
      </View>
    );
  }

  return (
    <FlatList
      data={rooms}
      keyExtractor={(room) => room.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const members: GroupMember[] = item.participants.map((participant) => ({
          id: participant.user.id,
          name:
            formatDisplayName(participant.user.firstName, participant.user.lastName) ??
            participant.user.email ??
            "Unknown participant",
          initials: getInitials(participant.user.firstName, participant.user.lastName),
          role: "",
          isLeader: false,
          avatarStoragePath: null,
        }));

        const isFull = item.occupancy >= item.capacity;

        return (
          <View style={styles.roomCard}>
            <WoodTexture radius={borderRadius.md} />
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={[styles.roomCapacity, isFull && styles.roomCapacityFull]}>
                {item.occupancy}/{item.capacity} beds
              </Text>
            </View>
            {members.length > 0 ? (
              <GroupMemberList members={members} />
            ) : (
              <Text style={styles.emptyRoom}>Empty room</Text>
            )}
          </View>
        );
      }}
    />
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    emptyWrapper: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
      justifyContent: "center",
    },
    roomCard: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      padding: spacing.lg,
    },
    roomHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    roomName: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
    },
    roomCapacity: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: palette.primary,
    },
    roomCapacityFull: {
      color: colors.warning,
    },
    emptyRoom: {
      fontSize: typography.sm,
      color: colors.textTertiary,
      fontStyle: "italic",
    },
  });
}
