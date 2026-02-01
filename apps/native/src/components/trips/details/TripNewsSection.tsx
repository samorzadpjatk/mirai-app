import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";

const newsItems = [
  {
    id: "meeting",
    icon: "time" as const,
    iconColor: colors.primary,
    iconBackground: colors.primaryOpacity20,
    title: "Meeting at lobby in 15 mins",
    time: "2m ago",
    description:
      "Mandatory gathering for all students for the evening briefing.",
  },
  {
    id: "scavenger",
    icon: "star" as const,
    iconColor: colors.accentMagenta,
    iconBackground: colors.magentaOpacity10,
    title: "Group B wins the Scavenger Hunt!",
    time: "1h ago",
    description:
      "Congrats to the 'Snow Leopards' for finding all items in record time.",
  },
  {
    id: "dinner",
    icon: "restaurant" as const,
    iconColor: colors.textSecondary,
    iconBackground: colors.slate800,
    title: "Dinner menu updated",
    time: "3h ago",
    description:
      "Check the 'Trip Info' section for tonight's alpine dining choices.",
  },
];

export function TripNewsSection() {
  return (
    <View style={styles.newsSection}>
      <View style={styles.newsSectionHeader}>
        <Text style={styles.sectionTitle}>Latest News</Text>
        <Text style={styles.viewAllLink}>View All</Text>
      </View>

      <View style={styles.newsList}>
        {newsItems.map((item) => (
          <View key={item.id} style={styles.newsItem}>
            <View
              style={[
                styles.newsIcon,
                { backgroundColor: item.iconBackground },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <View style={styles.newsContent}>
              <View style={styles.newsHeader}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsTime}>{item.time}</Text>
              </View>
              <Text style={styles.newsDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  newsSection: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  newsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  viewAllLink: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  newsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  newsItem: {
    backgroundColor: colors.cardDarkOpacity40,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    gap: spacing.lg,
  },
  newsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  newsContent: {
    flex: 1,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  newsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
    flex: 1,
    marginRight: spacing.sm,
  },
  newsTime: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.slate500,
  },
  newsDescription: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    lineHeight: typography.xs * typography.relaxed,
  },
});
