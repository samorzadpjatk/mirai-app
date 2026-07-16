import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName } from "@mirai-app/common/users";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import LoadingScreen from "~/components/LoadingScreen";
import { DeckBackground } from "~/components/common/DeckBackground";
import { useAdminRooms } from "~/hooks/admin/useAdminRooms";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

export default function EditRoomScreen() {
  const { roomId, tripId } = useLocalSearchParams<{ roomId?: string; tripId?: string }>();
  const router = useRouter();
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const { rooms, users, isLoading, updateRoom, deleteRoom, assignUser, removeUser, isMutating } =
    useAdminRooms(tripId ?? "");

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (room) {
      setName(room.name);
      setCapacity(String(room.capacity));
    }
  }, [room]);

  if (isLoading) {
    return <LoadingScreen />;
  }
  if (!room) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Room not found.</Text>
      </View>
    );
  }

  const occupantIds = new Set(room.participants.map((p) => p.user.id));

  const handleSave = async () => {
    const cap = Number.parseInt(capacity, 10);
    if (!name.trim() || !Number.isInteger(cap) || cap < 1) {
      Alert.alert("Error", "Enter a name and capacity ≥ 1.");
      return;
    }
    try {
      await updateRoom(room.id, name.trim(), cap);
      Alert.alert("Saved", "Changes saved.");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete room", `Delete room "${room.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRoom(room.id);
            router.back();
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete.");
          }
        },
      },
    ]);
  };

  const toggleUser = async (userId: string) => {
    try {
      if (occupantIds.has(userId)) {
        await removeUser(userId);
      } else {
        await assignUser(userId, room.id);
      }
    } catch (error) {
      Alert.alert(
        "Cannot assign",
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <DeckBackground />
      <FlatList
        data={users}
        keyExtractor={(user) => user.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={palette.gray600}
            />
            <Text style={styles.label}>Capacity</Text>
            <TextInput
              style={styles.input}
              value={capacity}
              onChangeText={(text) => setCapacity(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholderTextColor={palette.gray600}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, isMutating && styles.disabled]}
                onPress={handleSave}
                disabled={isMutating}
              >
                <Text style={styles.saveTxt}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.delBtn, isMutating && styles.disabled]}
                onPress={handleDelete}
                disabled={isMutating}
              >
                <Text style={styles.delTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>
              Assigned ({occupantIds.size}/{room.capacity})
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const inRoom = occupantIds.has(item.id);
          return (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => toggleUser(item.id)}
              disabled={isMutating}
            >
              <Text style={styles.userName}>
                {formatDisplayName(item.firstName, item.lastName) ?? item.email ?? "—"}
              </Text>
              <Ionicons
                name={inRoom ? "checkbox" : "square-outline"}
                size={22}
                color={inRoom ? palette.primary : palette.textTertiary}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.backgroundDark },
    centered: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: { color: palette.textSecondary, fontSize: typography.base },
    list: { padding: spacing.lg },
    header: { gap: spacing.sm, marginBottom: spacing.md },
    label: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: palette.textSecondary,
      marginTop: spacing.md,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    input: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.borderDark,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: palette.white,
      fontSize: typography.base,
    },
    actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
    saveBtn: {
      flex: 1,
      backgroundColor: palette.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    saveTxt: { fontWeight: typography.bold, color: palette.backgroundDark },
    delBtn: {
      flex: 1,
      backgroundColor: colors.dangerOpacity15,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    delTxt: { fontWeight: typography.bold, color: colors.danger },
    disabled: { opacity: 0.6 },
    sectionTitle: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: palette.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.borderDark,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    userName: { flex: 1, color: palette.white, fontSize: typography.base },
  });
}
