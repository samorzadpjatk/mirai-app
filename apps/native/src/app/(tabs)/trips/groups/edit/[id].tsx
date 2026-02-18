import { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useGroupEditor } from "~/hooks/groups";
import { colors, spacing, typography } from "../../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useFileUpload } from "~/hooks/files";
import { EditGroupFormFields } from "~/components/trips/groups/edit/EditGroupFormFields";
import { EditMembersSearchBar } from "~/components/trips/groups/edit/EditMembersSearchBar";
import { EditMembersPicker } from "~/components/trips/groups/edit/EditMembersPicker";
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

export default function EditGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { group, isLoading: groupLoading } = useGroupEditor(groupId);

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: group?.trip?.id ?? "" }),
    enabled: !!group?.trip?.id,
  });

  const [groupName, setGroupName] = useState("");
  const [groupImagePath, setGroupImagePath] = useState<string | undefined>();
  const [groupImagePreviewUri, setGroupImagePreviewUri] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
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

  const { updateGroup, assignUser, removeUser, isUpdating } =
    useGroupEditor(groupId);

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
      // Update group name
      await updateGroup({
        id: groupId ?? "",
        name: groupName,
        image: groupImagePath,
      });

      // Handle member changes
      const originalMembers = new Set(
        group?.participants?.map((p) => p.user.id) ?? [],
      );
      const membersToAdd = Array.from(currentMembers).filter(
        (id) => !originalMembers.has(id),
      );
      const membersToRemove = Array.from(originalMembers).filter(
        (id) => !currentMembers.has(id),
      );

      // Add new members
      for (const userId of membersToAdd) {
        await assignUser(userId, group?.trip?.id ?? "");
      }

      // Remove members
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

  const toggleMember = (userId: string) => {
    const newMembers = new Set(currentMembers);
    if (newMembers.has(userId)) {
      // Don't allow removing the organizer
      if (userId === group?.organizer?.id) {
        Alert.alert("Error", "Cannot remove group organizer");
        return;
      }
      newMembers.delete(userId);
    } else {
      newMembers.add(userId);
    }
    setCurrentMembers(newMembers);
  };

  const availableParticipants = useMemo(() => {
    const participants = trip?.participants ?? [];
    return participants.filter((participant) => {
      const fullName =
        `${participant.user.firstName} ${participant.user.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [trip?.participants, searchQuery]);

  // Check if current user is the organizer
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

        {/* Manage Members Section */}
        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Manage Members</Text>

          {/* Search */}
          <EditMembersSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Members List */}
          <EditMembersPicker
            participants={availableParticipants ?? []}
            selectedMembers={currentMembers}
            isLoading={tripLoading}
            organizerId={group.organizer?.id}
            onToggleMember={toggleMember}
          />
        </View>

        {/* Save Button */}
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
});
