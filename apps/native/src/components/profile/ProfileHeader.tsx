import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return colors.accentMagenta;
    case "MODERATOR":
      return colors.primary;
    case "SERVICE":
      return colors.slate400;
    default:
      return colors.textMuted;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "MODERATOR":
      return "Moderator";
    case "SERVICE":
      return "Service";
    case "USER":
      return "User";
    default:
      return role;
  }
};

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case "ADMIN":
      return {
        backgroundColor: colors.magentaOpacity10,
        borderColor: colors.magentaOpacity30,
      };
    case "MODERATOR":
      return {
        backgroundColor: colors.primaryOpacity10,
        borderColor: colors.primaryOpacity30,
      };
    case "SERVICE":
      return {
        backgroundColor: "rgba(148, 163, 184, 0.12)",
        borderColor: "rgba(148, 163, 184, 0.35)",
      };
    default:
      return {
        backgroundColor: "rgba(71, 85, 105, 0.15)",
        borderColor: "rgba(71, 85, 105, 0.35)",
      };
  }
};

export function ProfileHeader() {
  const router = useRouter();
  const trpc = useTRPC();
  const userMyQueryOptions = trpc.user.getMy.queryOptions();
  const { data: currentUser } = useQuery(userMyQueryOptions);

  const first = currentUser?.firstName;
  const last = currentUser?.lastName;
  const roleValue = (currentUser?.role ?? "USER").toUpperCase();
  const initials = `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`;
  const roleColor = getRoleColor(roleValue);
  const roleBadgeStyle = getRoleBadgeStyle(roleValue);

  return (
    <View style={styles.profileHeader}>
      {roleValue === "ADMIN" && (
        <TouchableOpacity
          accessibilityLabel="Open admin dashboard"
          style={styles.adminButton}
          onPress={() => router.push("/profile/admin")}
          activeOpacity={0.85}
        >
          <Ionicons name="settings" size={20} color={colors.accentMagenta} />
        </TouchableOpacity>
      )}
      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>{initials}</Text>
      </View>

      <Text style={styles.userName}>
        {first} {last}
      </Text>

      <View style={[styles.roleBadge, roleBadgeStyle]}>
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
    position: "relative",
  },
  adminButton: {
    position: "absolute",
    top: 0,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.magentaOpacity10,
    borderWidth: 1,
    borderColor: colors.magentaOpacity30,
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
