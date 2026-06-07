import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "~/styles";

const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheAgeWarningProps {
  cachedAt: Date | string | number | null | undefined;
  isOffline?: boolean;
}

export function CacheAgeWarning({ cachedAt, isOffline }: CacheAgeWarningProps) {
  if (!cachedAt) return null;

  const cachedTime = new Date(cachedAt).getTime();
  const ageMs = Date.now() - cachedTime;

  if (ageMs < MAX_CACHE_AGE_MS) return null;

  const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>
        {isOffline
          ? `Data is ${daysOld} days old — may be outdated`
          : `Data is ${daysOld} days old — refreshing...`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.warning,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
});
