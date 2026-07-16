import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface GroupImagePickerProps {
  imageUri: string | null;
  onPickImage: () => void;
  isUploading?: boolean;
  uploadPercent?: number | null;
}

export function GroupImagePicker({
  imageUri,
  onPickImage,
  isUploading = false,
  uploadPercent = null,
}: GroupImagePickerProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} testID="group-image-picker-container">
      <Text style={styles.label}>Group Image</Text>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={onPickImage}
        disabled={isUploading}
        testID="group-image-picker-touchable"
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            testID="group-image-picker-image"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="images-outline" size={28} color={palette.primary} />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        <View style={styles.badge}>
          {isUploading ? (
            <>
              <ActivityIndicator
                size="small"
                color={colors.white}
                testID="group-image-picker-activity-indicator"
              />
              <Text style={styles.badgeText}>
                {uploadPercent != null ? `Uploading ${uploadPercent}%` : "Uploading..."}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={16} color={colors.white} />
              <Text style={styles.badgeText}>{imageUri ? "Change Photo" : "Add Photo"}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.xl,
    },
    label: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: palette.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    card: {
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(48, 54, 61, 1)",
      backgroundColor: palette.cardDark,
    },
    image: {
      width: "100%",
      height: 180,
    },
    placeholder: {
      height: 160,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: "rgba(39, 41, 53, 0.65)",
    },
    placeholderText: {
      color: palette.textMuted,
      fontSize: typography.sm,
      fontWeight: typography.medium,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.md,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.08)",
    },
    badgeText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: typography.bold,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
}
