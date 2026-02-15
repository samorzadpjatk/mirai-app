import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface GroupImagePickerProps {
  image: string | null;
  onPress: () => void;
}

export function GroupImagePicker({ image, onPress }: GroupImagePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Photo</Text>
      <TouchableOpacity
        style={styles.picker}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {image ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color={colors.white} />
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <Text style={styles.placeholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  picker: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: colors.primaryOpacity80,
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    borderStyle: "dashed",
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: typography.medium,
    color: colors.textMuted,
  },
});
