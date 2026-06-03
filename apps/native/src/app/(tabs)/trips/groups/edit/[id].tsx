import { orpc } from "@mirai-app/orpc/client";
import { formatDisplayName, getInitials } from "@mirai-app/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupImagePicker } from "~/components/trips/groups/GroupImagePicker";
import { EditGroupFormFields } from "~/components/trips/groups/edit/EditGroupFormFields";
import { GroupEditLoadingState } from "~/components/trips/groups/edit/GroupEditLoadingState";
import { GroupEditNoTripState } from "~/components/trips/groups/edit/GroupEditNoTripState";
import { GroupEditNotFoundState } from "~/components/trips/groups/edit/GroupEditNotFoundState";
import { GroupEditPermissionState } from "~/components/trips/groups/edit/GroupEditPermissionState";
import { SaveGroupButton } from "~/components/trips/groups/edit/SaveGroupButton";
import { useFileUpload } from "~/hooks/files";
import { useGroupEditor } from "~/hooks/groups";
import { useTripDetails } from "~/hooks/trips";
import { getFileContentType, getFileExtension } from "~/utils/image";
import { colors, borderRadius as radius, spacing, typography } from "../../../../../styles";

export default function EditGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const insets = useSafeAreaInsets();

  const { data: currentUser } = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

  const { group, isLoading: groupLoading } = useGroupEditor(groupId);
  const { isTripPast } = useTripDetails(group?.trip?.id);

  useEffect(() => {
    if (isTripPast && group?.trip?.id) {
      router.replace(`/trips/groups/${groupId}`);
    }
  }, [isTripPast, group?.trip?.id, groupId, router]);

  const [groupName, setGroupName] = useState("");
  const [groupImagePath, setGroupImagePath] = useState<string | undefined>();
  const [groupImagePreviewUri, setGroupImagePreviewUri] = useState<string | null>(null);
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
  const deleteGroupMutation = useMutation(orpc.group.deleteMyGroup.mutationOptions());

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

      const originalMembers = new Set(group?.participants?.map((p) => p.user.id) ?? []);
      const membersToRemove = Array.from(originalMembers).filter((id) => !currentMembers.has(id));

      for (const userId of membersToRemove) {
        await removeUser(userId);
      }

      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save group changes";
      Alert.alert("Error", message);
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
    const extension = getFileExtension(asset);
    const storagePath = `group/${group.trip.id}/${groupId}-${Date.now()}.${extension}`;

    try {
      await upload({
        storagePath,
        fileUri: asset.uri,
        fileName: asset.fileName ?? `group-cover-${Date.now()}.${extension}`,
        contentType: asset.mimeType ?? getFileContentType(extension),
        upsert: true,
      });
      setGroupImagePath(storagePath);
      setGroupImagePreviewUri(asset.uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
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

  const handleDeleteGroup = () => {
    if (!group) return;
    Alert.alert("Delete Group", "This will archive the group and remove all members. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteGroupMutation.mutateAsync({ groupId: group.id });
              router.replace(`/trips/groups?tripId=${group.trip.id}`);
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to delete group";
              Alert.alert("Error", message);
            }
          })();
        },
      },
    ]);
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
        <EditGroupFormFields groupName={groupName} onChangeName={setGroupName} />
        <GroupImagePicker
          imageUri={groupImagePreviewUri}
          onPickImage={() => void handlePickImage()}
          isUploading={uploadStatus === "uploading"}
          uploadPercent={
            uploadProgress.percent != null ? Math.round(uploadProgress.percent * 100) : null
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
                        {formatDisplayName(participant.user.firstName, participant.user.lastName) ??
                          "Unknown user"}
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

        <SaveGroupButton isSubmitting={isUpdating} onPress={() => void handleSave()} />

        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.8}
          onPress={handleDeleteGroup}
          disabled={deleteGroupMutation.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
          </Text>
        </TouchableOpacity>
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
    borderColor: colors.borderZinc700,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteOpacity5,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
    borderWidth: 1,
    borderColor: colors.whiteOpacity10,
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
    backgroundColor: colors.dangerOpacity12,
    borderWidth: 1,
    borderColor: colors.dangerOpacity50,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  removeButtonDisabled: {
    opacity: 0.7,
    borderColor: colors.whiteOpacity12,
    backgroundColor: colors.whiteOpacity4,
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
  deleteButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.redOpacity500Background,
    borderWidth: 1,
    borderColor: colors.redOpacity500,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
