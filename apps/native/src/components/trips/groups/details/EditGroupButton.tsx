import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "~/styles";

interface EditGroupButtonProps {
  onPress: () => void;
}

export function EditGroupButton({ onPress }: EditGroupButtonProps) {
  return (
    <TouchableOpacity
      style={styles.editButton}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name="create" size={28} color={colors.backgroundDark} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  editButton: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
