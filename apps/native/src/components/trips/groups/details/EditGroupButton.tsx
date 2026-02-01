import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors } from "~/styles";

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
      <Ionicons name="pencil" size={20} color={colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  editButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
