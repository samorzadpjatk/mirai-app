import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface CapturedImageCardProps {
  imageUri: string;
  onRetake: () => void;
  onDone: () => void;
}

export function CapturedImageCard({ imageUri, onRetake, onDone }: CapturedImageCardProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <WoodTexture radius={borderRadius.xl} />
      <Text style={styles.title}>Submission sent - pending review</Text>

      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
          <Ionicons name="refresh" size={20} color="#ef4444" />
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDone} style={styles.doneButton}>
          <Ionicons name="checkmark-circle" size={20} color={colors.backgroundDark} />
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: "rgba(0, 206, 209, 0.3)",
    },
    title: {
      fontSize: 12,
      fontWeight: typography.bold,
      color: palette.primary,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: spacing.lg,
      textAlign: "center",
    },
    image: {
      width: "100%",
      aspectRatio: 4 / 3,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
    },
    actionsRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    retakeButton: {
      flex: 1,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderRadius: borderRadius.md,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.3)",
    },
    retakeText: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: "#ef4444",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    doneButton: {
      flex: 1,
      backgroundColor: palette.primary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    doneText: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
