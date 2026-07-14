import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAdminRooms } from "~/hooks/admin/useAdminRooms";
import { borderRadius, colors, spacing, typography } from "~/styles";

export default function NewRoomScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const { createRoom, isMutating } = useAdminRooms(tripId ?? "");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleCreate = async () => {
    const cap = Number.parseInt(capacity, 10);
    if (!name.trim()) {
      Alert.alert("Błąd", "Podaj nazwę pokoju.");
      return;
    }
    if (!Number.isInteger(cap) || cap < 1) {
      Alert.alert("Błąd", "Pojemność musi być liczbą ≥ 1.");
      return;
    }
    try {
      await createRoom(name.trim(), cap);
      router.back();
    } catch (error) {
      Alert.alert(
        "Błąd",
        error instanceof Error ? error.message : "Nie udało się utworzyć pokoju.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nazwa pokoju</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="np. Pokój 101"
        placeholderTextColor={colors.gray600}
      />

      <Text style={styles.label}>Pojemność (liczba łóżek)</Text>
      <TextInput
        style={styles.input}
        value={capacity}
        onChangeText={(text) => setCapacity(text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder="np. 4"
        placeholderTextColor={colors.gray600}
      />

      <TouchableOpacity
        style={[styles.button, isMutating && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isMutating}
      >
        <Text style={styles.buttonText}>{isMutating ? "Tworzenie..." : "Utwórz pokój"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: typography.base,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
});
