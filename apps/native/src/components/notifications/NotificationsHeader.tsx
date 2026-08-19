import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

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
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.createButton} onPress={onCreate}>
        <Ionicons name="add" size={16} color={palette.backgroundDark} />
        <Text style={styles.createButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: palette.white,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: palette.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    createButtonText: {
      color: palette.backgroundDark,
      fontWeight: "600",
      fontSize: 14,
    },
  });
}
