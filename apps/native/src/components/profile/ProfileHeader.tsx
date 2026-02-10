import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useFileDownload, useFileUpload } from "~/hooks/files";

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
  const queryClient = useQueryClient();
  const userMyQueryOptions = trpc.user.getMy.queryOptions();
  const { data: currentUser } = useQuery(userMyQueryOptions);
  const [isPicking, setIsPicking] = useState(false);

  const {
    upload,
    status: uploadStatus,
    reset: resetUpload,
  } = useFileUpload();
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

  const updateAvatarMutation = useMutation(
    trpc.user.updateAvatar.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userMyQueryOptions.queryKey,
        });
      },
    }),
  );

  const first = currentUser?.firstName;
  const last = currentUser?.lastName;
  const roleValue = (currentUser?.role ?? "USER").toUpperCase();
  const initials = `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`;
  const roleColor = getRoleColor(roleValue);
  const roleBadgeStyle = getRoleBadgeStyle(roleValue);
  const isUploading = uploadStatus === "uploading";
  const isDownloading = avatarStatus === "loading";
  const isBusy = isUploading || isDownloading || isPicking;
  const avatarUri = avatarFile?.uri ?? null;

  const refreshAvatar = useCallback(
    async (skipCache = false) => {
      if (!avatarStoragePath) return;
      resetAvatar();
      await downloadAvatar({ storagePath: avatarStoragePath, skipCache });
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

  const startPicker = useCallback(
    async (source: "camera" | "library") => {
      if (!currentUser?.id || !avatarStoragePath) return;

      try {
        setIsPicking(true);
        const permissionResult =
          source === "camera"
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          permissionResult.status !== ImagePicker.PermissionStatus.GRANTED
        ) {
          Alert.alert(
            "Permission Required",
            source === "camera"
              ? "Camera access is required to take a new avatar."
              : "Photo library access is required to pick an avatar.",
          );
          return;
        }

        const result =
          source === "camera"
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: "images",
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        const contentType = asset.mimeType ?? "image/jpeg";
        const fileName = asset.fileName ?? `avatar-${currentUser.id}.jpg`;

        resetUpload();
        await upload({
          storagePath: avatarStoragePath,
          fileUri: asset.uri,
          fileName,
          contentType,
          upsert: true,
        });

        await updateAvatarMutation.mutateAsync({ hasAvatar: true });
        await refreshAvatar(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update avatar";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsPicking(false);
      }
    },
    [
      avatarStoragePath,
      currentUser?.id,
      refreshAvatar,
      resetUpload,
      updateAvatarMutation,
      upload,
    ],
  );

  const handleEditAvatar = useCallback(() => {
    if (isBusy) return;
    Alert.alert("Update Avatar", "Choose a source", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Choose Photo",
        onPress: () => void startPicker("library"),
      },
      {
        text: "Take Photo",
        onPress: () => void startPicker("camera"),
      },
    ]);
  }, [isBusy, startPicker]);

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
      <TouchableOpacity
        style={styles.avatarLarge}
        onPress={handleEditAvatar}
        activeOpacity={0.85}
        accessibilityLabel="Edit avatar"
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarLargeText}>{initials}</Text>
        )}
        {isBusy && (
          <View style={styles.avatarOverlay}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          <Ionicons name="camera" size={16} color={colors.white} />
        </View>
      </TouchableOpacity>

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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  avatarEditBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
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
