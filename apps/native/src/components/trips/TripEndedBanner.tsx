import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography, borderRadius } from "~/styles";

interface TripEndedBannerProps {
  visible?: boolean;
}

export const TripEndedBanner: React.FC<TripEndedBannerProps> = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>This trip has ended — view only</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.backgroundDarkOpacity55,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.warning,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    flex: 1,
  },
});
