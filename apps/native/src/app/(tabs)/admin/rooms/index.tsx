import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoadingScreen from "~/components/LoadingScreen";
import { EmptyState } from "~/components/common/ui";
import { useAdminRooms } from "~/hooks/admin/useAdminRooms";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

export default function AdminRoomsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const { rooms, isLoading, isRefetching, refetchRooms } = useAdminRooms(tripId ?? "");

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(room) => room.id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetchRooms}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="bed-outline"
              title="No rooms"
              subtitle="Create your first room with the + button."
            />
          </View>
        }
        renderItem={({ item }) => {
          const isFull = item.occupancy >= item.capacity;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/admin/rooms/edit/${item.id}?tripId=${tripId ?? ""}`)}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="bed" size={22} color={palette.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={[styles.cardSub, isFull && styles.cardSubFull]}>
                  {item.occupancy}/{item.capacity} beds{isFull ? " · full" : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/admin/rooms/new?tripId=${tripId ?? ""}`)}
      >
        <Ionicons name="add" size={28} color={palette.backgroundDark} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.backgroundDark },
    list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
    emptyWrapper: { flex: 1, justifyContent: "center", paddingTop: spacing.xl * 2 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      padding: spacing.lg,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      backgroundColor: palette.primaryOpacity10,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: { flex: 1 },
    cardName: { fontSize: typography.base, fontWeight: typography.bold, color: palette.white },
    cardSub: { fontSize: typography.sm, color: palette.textTertiary, marginTop: 2 },
    cardSubFull: { color: colors.warning },
    fab: {
      position: "absolute",
      right: spacing.lg,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: palette.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  });
}
