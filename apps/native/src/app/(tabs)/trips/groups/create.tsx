import { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useCreateGroup } from "~/hooks/groups";
import { colors, spacing, typography } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useFileUpload } from "~/hooks/files";
import { CreateGroupButton } from "~/components/trips/groups/create/CreateGroupButton";
import { GroupCreateNoTripState } from "~/components/trips/groups/create/GroupCreateNoTripState";
import { GroupFormFields } from "~/components/trips/groups/create/GroupFormFields";
import { MembersPicker } from "~/components/trips/groups/create/MembersPicker";
import { MembersSearchBar } from "~/components/trips/groups/create/MembersSearchBar";
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

export default function CreateGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const [groupName, setGroupName] = useState("");
  const [groupImagePath, setGroupImagePath] = useState<string | undefined>();
  const [groupImagePreviewUri, setGroupImagePreviewUri] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId,
  });

  const { createGroup, isCreating } = useCreateGroup(tripId);

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Validation Error", "Please enter a group name");
      return;
    }
    if (uploadStatus === "uploading") {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    try {
      const newGroup = await createGroup({
        name: groupName,
        image: groupImagePath,
        selectedMembers: Array.from(selectedMembers),
      });
      Alert.alert("Success", "Group created successfully!");
      router.push(`/trips/groups/${newGroup.id}`);
    } catch (err: unknown) {
      console.error("Create group error:", err);
      if (err instanceof Error) {
        Alert.alert("Error", err.message);
      } else {
        Alert.alert("Error", "Failed to create group");
      }
    }
  };

  const handlePickImage = async () => {
    if (!tripId) return;
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
    const storagePath = `group/${tripId}/cover-${Date.now()}.${extension}`;

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

  const filteredParticipants = useMemo(() => {
    const participants = trip?.participants ?? [];
    return participants.filter((participant) => {
      if (participant.user.id === currentUser?.id) return false;
      const fullName =
        `${participant.user.firstName} ${participant.user.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [trip?.participants, currentUser?.id, searchQuery]);

  if (!tripId) {
    return <GroupCreateNoTripState onGoBack={() => router.back()} />;
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
        <GroupFormFields
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

        {/* Add Members Section */}
        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Add Members</Text>

          {/* Search */}
          <MembersSearchBar value={searchQuery} onChangeText={setSearchQuery} />

          {/* Members List */}
          <MembersPicker
            participants={filteredParticipants}
            selectedMembers={selectedMembers}
            isLoading={tripLoading}
            onToggleMember={toggleMember}
          />
        </View>
        {/* Create Button at bottom of scroll */}
        <CreateGroupButton
          isSubmitting={isCreating}
          onPress={handleCreateGroup}
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
    paddingBottom: spacing.xxxl,
  },
  memberSection: {
    marginBottom: spacing.xl,
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
});
