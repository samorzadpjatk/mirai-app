import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useGroupEditor } from "~/hooks/groups";
import {
  borderRadius as radius,
  colors,
  spacing,
  typography,
} from "../../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useFileUpload } from "~/hooks/files";
import { EditGroupFormFields } from "~/components/trips/groups/edit/EditGroupFormFields";
import { GroupEditLoadingState } from "~/components/trips/groups/edit/GroupEditLoadingState";
import { GroupEditNoTripState } from "~/components/trips/groups/edit/GroupEditNoTripState";
import { GroupEditNotFoundState } from "~/components/trips/groups/edit/GroupEditNotFoundState";
import { GroupEditPermissionState } from "~/components/trips/groups/edit/GroupEditPermissionState";
import { SaveGroupButton } from "~/components/trips/groups/edit/SaveGroupButton";
import { GroupImagePicker } from "~/components/trips/groups/GroupImagePicker";

const getImageExtension = (asset: ImagePicker.ImagePickerAsset) => {
  if (asset.fileName) {
    const parts = asset.fileName.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1]?.toLowerCase() ?? "jpg";
    }
  }

  const contentType = asset.mimeType ?? "";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
  return "jpg";
};

const getImageContentType = (extension: string) => {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
};

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const f = (firstName ?? "")[0] ?? "";
  const l = (lastName ?? "")[0] ?? "";
  const initials = `${f}${l}`.toUpperCase();
  return initials || "?";
};

export default function EditGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { group, isLoading: groupLoading } = useGroupEditor(groupId);

  const [groupName, setGroupName] = useState("");
  const [groupImagePath, setGroupImagePath] = useState<string | undefined>();
  const [groupImagePreviewUri, setGroupImagePreviewUri] = useState<string | null>(
    null,
  );
  const [currentMembers, setCurrentMembers] = useState<Set<string>>(new Set());
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();

  useEffect(() => {
    if (!group) return;
    // Defer state updates to avoid calling setState synchronously within the effect
    // which can cause cascading renders and trigger the lint rule
    const id = setTimeout(() => {
      setGroupName(group.name);
      setGroupImagePreviewUri(group.image ?? null);
      setCurrentMembers(new Set(group.participants.map((p) => p.user.id)));
    }, 0);
    return () => clearTimeout(id);
  }, [group]);

  const { updateGroup, removeUser, isUpdating } = useGroupEditor(groupId);

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert("Validation Error", "Please enter a group name");
      return;
    }
    if (uploadStatus === "uploading") {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    try {
      await updateGroup({
        id: groupId ?? "",
        name: groupName,
        image: groupImagePath,
      });

      const originalMembers = new Set(
        group?.participants?.map((p) => p.user.id) ?? [],
      );
      const membersToRemove = Array.from(originalMembers).filter(
        (id) => !currentMembers.has(id),
      );

      for (const userId of membersToRemove) {
        await removeUser(userId);
      }

      router.back();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handlePickImage = async () => {
    if (!group?.trip?.id || !groupId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert("Permission Required", "Photo library access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const extension = getImageExtension(asset);
    const storagePath = `group/${group.trip.id}/${groupId}-${Date.now()}.${extension}`;

    try {
      await upload({
        storagePath,
        fileUri: asset.uri,
        fileName: asset.fileName ?? `group-cover-${Date.now()}.${extension}`,
        contentType: asset.mimeType ?? getImageContentType(extension),
        upsert: true,
      });
      setGroupImagePath(storagePath);
      setGroupImagePreviewUri(asset.uri);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const removeMember = (userId: string) => {
    if (userId === group?.organizer?.id) {
      Alert.alert("Error", "Cannot remove group leader");
      return;
    }

    setCurrentMembers((previous) => {
      const next = new Set(previous);
      next.delete(userId);
      return next;
    });
  };

  const visibleMembers = useMemo(() => {
    const members = group?.participants ?? [];
    return members
      .filter((participant) => currentMembers.has(participant.user.id))
      .sort((a, b) =>
        a.user.id === group?.organizer?.id ? -1 : b.user.id === group?.organizer?.id ? 1 : 0,
      );
  }, [currentMembers, group?.organizer?.id, group?.participants]);

  const isOrganizer = currentUser?.id === group?.organizer?.id;

  if (!groupId) {
    return <GroupEditNoTripState onGoBack={() => router.back()} />;
  }

  if (groupLoading) {
    return <GroupEditLoadingState />;
  }

  if (!group) {
    return <GroupEditNotFoundState onGoBack={() => router.back()} />;
  }

  if (!isOrganizer) {
    return (
      <GroupEditPermissionState
        message="Only group organizer can edit"
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <EditGroupFormFields
          groupName={groupName}
          onChangeName={setGroupName}
        />
        <GroupImagePicker
          imageUri={groupImagePreviewUri}
          onPickImage={() => void handlePickImage()}
          isUploading={uploadStatus === "uploading"}
          uploadPercent={
            uploadProgress.percent != null
              ? Math.round(uploadProgress.percent * 100)
              : null
          }
        />

        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Member Directory</Text>

          <View style={styles.memberListContainer}>
            {visibleMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No members left in this group</Text>
              </View>
            ) : (
              visibleMembers.map((participant) => {
                const userId = participant.user.id;
                const isLeader = userId === group.organizer?.id;

                return (
                  <View key={userId} style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {getInitials(participant.user.firstName, participant.user.lastName)}
                      </Text>
                    </View>

                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {[participant.user.firstName, participant.user.lastName]
                          .filter(Boolean)
                          .join(" ") || "Unknown user"}
                      </Text>
                      <Text style={styles.memberMeta}>
                        {participant.user.email ?? "No email"}
                        {isLeader ? " (Leader)" : ""}
                      </Text>
                    </View>

                    {isLeader ? (
                      <View style={[styles.removeButton, styles.removeButtonDisabled]}>
                        <Text style={styles.removeButtonText}>Leader</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.removeButton}
                        activeOpacity={0.8}
                        onPress={() => removeMember(userId)}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        <SaveGroupButton
          isSubmitting={isUpdating}
          onPress={() => void handleSave()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  memberSection: {
    marginBottom: spacing.xl,
  },
  memberListContainer: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
    marginBottom: 2,
  },
  memberMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  removeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  removeButtonDisabled: {
    opacity: 0.7,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  removeButtonText: {
    fontSize: 11,
    fontWeight: typography.bold,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.base,
    color: colors.textMuted,
  },
});
