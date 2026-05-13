import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCreateGroup } from "~/hooks/groups";
import { useTripDetails } from "~/hooks/trips";
import { colors, spacing } from "../../../../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFileUpload } from "~/hooks/files";
import { CreateGroupButton } from "~/components/trips/groups/create/CreateGroupButton";
import { GroupCreateNoTripState } from "~/components/trips/groups/create/GroupCreateNoTripState";
import { GroupFormFields } from "~/components/trips/groups/create/GroupFormFields";
import { GroupImagePicker } from "~/components/trips/groups/GroupImagePicker";
import { getImageExtension, getImageContentType } from "~/utils/image";

export default function CreateGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState("");
  const [groupImagePath, setGroupImagePath] = useState<string | undefined>();
  const [groupImagePreviewUri, setGroupImagePreviewUri] = useState<string | null>(null);
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();

  const { createGroup, isCreating } = useCreateGroup(tripId);
  const { isTripPast } = useTripDetails(tripId);

  useEffect(() => {
    if (isTripPast && tripId) {
      router.replace(`/trips/groups?tripId=${tripId}`);
    }
  }, [isTripPast, tripId, router]);

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
      const message = error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

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
        <GroupFormFields groupName={groupName} onChangeName={setGroupName} />
        <GroupImagePicker
          imageUri={groupImagePreviewUri}
          onPickImage={() => void handlePickImage()}
          isUploading={uploadStatus === "uploading"}
          uploadPercent={
            uploadProgress.percent != null ? Math.round(uploadProgress.percent * 100) : null
          }
        />
        {/* Create Button at bottom of scroll */}
        <CreateGroupButton isSubmitting={isCreating} onPress={handleCreateGroup} />
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
});
