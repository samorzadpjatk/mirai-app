import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAdminRooms } from "~/hooks/admin/useAdminRooms";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

export default function NewRoomScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const { createRoom, isMutating } = useAdminRooms(tripId ?? "");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleCreate = async () => {
    const cap = Number.parseInt(capacity, 10);
    if (!name.trim()) {
      Alert.alert("Error", "Enter a room name.");
      return;
    }
    if (!Number.isInteger(cap) || cap < 1) {
      Alert.alert("Error", "Capacity must be a number ≥ 1.");
      return;
    }
    try {
      await createRoom(name.trim(), cap);
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create room.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Room name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Room 101"
        placeholderTextColor={palette.gray600}
      />

      <Text style={styles.label}>Capacity (beds)</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={(text) => setCapacity(text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="e.g. 4"
        placeholderTextColor={palette.gray600}
      />

      <TouchableOpacity
        style={[styles.button, isMutating && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isMutating}
      >
        <Text style={styles.buttonText}>{isMutating ? "Creating..." : "Create room"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
      padding: spacing.lg,
      gap: spacing.sm,
    },
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
    button: {
      marginTop: spacing.xl,
      backgroundColor: palette.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      fontSize: typography.base,
      fontWeight: typography.bold,
      color: palette.backgroundDark,
    },
  });
}
