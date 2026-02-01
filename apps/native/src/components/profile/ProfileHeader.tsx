import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery } from "@tanstack/react-query";

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return colors.accentMagenta;
    case "moderator":
      return colors.primary;
    default:
      return colors.textMuted;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin":
      return "Administrator";
    case "moderator":
      return "Moderator";
    default:
      return "User";
  }
};

export function ProfileHeader() {
  const trpc = useTRPC();
  const userMyQueryOptions = trpc.user.getMy.queryOptions();
  const { data: currentUser } = useQuery(userMyQueryOptions);

  const first = currentUser?.firstName;
  const last = currentUser?.lastName;
  const roleValue = currentUser?.role ?? "user";
  const initials = `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`;
  const roleColor = getRoleColor(roleValue);

  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>{initials}</Text>
      </View>

      <Text style={styles.userName}>
        {first} {last}
      </Text>

      <View style={styles.roleBadge}>
        <Ionicons name="shield" size={14} color={roleColor} />
        <Text style={[styles.roleText, { color: roleColor }]}>
          {" "}
          {getRoleLabel(roleValue)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardDark,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  userName: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.3)",
  },
  roleText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
