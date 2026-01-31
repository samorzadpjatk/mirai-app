import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationsHeaderProps {
  title?: string;
  buttonLabel?: string;
  onCreate: () => void;
}

export function NotificationsHeader({
  title = "Notification Schedules",
  buttonLabel = "Create",
  onCreate,
}: NotificationsHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.createButton} onPress={onCreate}>
        <Ionicons name="add" size={16} color="#17181c" />
        <Text style={styles.createButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00ced1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: "#17181c",
    fontWeight: "600",
    fontSize: 14,
  },
});
