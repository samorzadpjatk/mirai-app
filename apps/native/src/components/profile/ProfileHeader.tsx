import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo } from "react";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@mirai-app/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useFileDownload } from "~/hooks/files";

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
  const trpc = useTRPC();
  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());
  const {
    download: downloadAvatar,
    status: avatarStatus,
    file: avatarFile,
    reset: resetAvatar,
    abort: abortAvatar,
  } = useFileDownload();

  const avatarStoragePath = useMemo(() => {
    if (!currentUser?.id) return null;
    return `avatar/${currentUser.id}.jpg`;
  }, [currentUser?.id]);

  const first = currentUser?.firstName;
  const last = currentUser?.lastName;
  const roleValue = (currentUser?.role ?? "USER").toUpperCase();
  const initials = `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`;
  const roleColor = getRoleColor(roleValue);
  const roleBadgeStyle = getRoleBadgeStyle(roleValue);
  const isDownloading = avatarStatus === "loading";
  const avatarUri = avatarFile?.uri
    ? `${avatarFile.uri}?v=${encodeURIComponent(currentUser?.updatedAt?.toISOString() ?? "")}`
    : null;

  const refreshAvatar = useCallback(
    async (skipCache = false) => {
      if (!avatarStoragePath) return;
      resetAvatar();
      await downloadAvatar({ storagePath: avatarStoragePath, skipCache }).catch(
        () => undefined,
      );
    },
    [avatarStoragePath, downloadAvatar, resetAvatar],
  );

  useEffect(() => {
    if (!currentUser?.hasAvatar || !avatarStoragePath) {
      resetAvatar();
      return;
    }

    void refreshAvatar();

    return () => {
      abortAvatar();
    };
  }, [
    abortAvatar,
    avatarStoragePath,
    currentUser?.hasAvatar,
    currentUser?.updatedAt,
    refreshAvatar,
    resetAvatar,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!currentUser?.hasAvatar || !avatarStoragePath) return;
      void refreshAvatar(true);
    }, [avatarStoragePath, currentUser?.hasAvatar, refreshAvatar]),
  );

  return (
    <View testID="profile-header" style={styles.profileHeader}>
      <View style={styles.avatarLarge}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="none"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLargeText}>{initials}</Text>
            {isDownloading ? (
              <Text style={styles.avatarLoadingText}>Loading...</Text>
            ) : null}
          </View>
        )}
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  avatarLoadingText: {
    fontSize: typography.xs,
    color: colors.textMuted,
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
