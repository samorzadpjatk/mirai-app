import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@mirai-app/trpc/client";
import { getImageExtension, getImageContentType } from "~/utils/image";
import { useFileUpload } from "~/hooks/files";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";

export default function AdminCreateActivityScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const { upload, reset: resetUpload, status: uploadStatus, progress: uploadProgress } =
    useFileUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);

  const feedQueryOptions = trpc.activityFeed.getByTripModeration.queryOptions({
    tripId,
    page: 1,
    pageSize: 100,
  });

  const createCustomMutation = useMutation(
    trpc.activityFeed.createCustom.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: feedQueryOptions.queryKey });
        setTitle("");
        setDescription("");
        setIsPinned(false);
        setImagePath("");
        setImagePreviewUri(null);
        resetUpload();
        Alert.alert("Success", "Activity created successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent =
    uploadProgress.percent != null ? Math.round(uploadProgress.percent * 100) : null;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const extension = getImageExtension(asset);
      const fileName = asset.fileName?.trim() ?? `custom-activity-${Date.now()}.${extension}`;
      const storagePath = `activity/${tripId}/custom-${Date.now()}.${extension}`;
      const contentType = asset.mimeType ?? getImageContentType(extension);

      await upload({
        storagePath,
        fileUri: asset.uri,
        fileName,
        contentType,
        upsert: true,
      });

      setImagePath(storagePath);
      setImagePreviewUri(asset.uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Validation", "Title is required.");
      return;
    }

    if (!tripId) {
      Alert.alert("Error", "Trip context is required.");
      return;
    }

    if (isUploadingImage) {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    try {
      await createCustomMutation.mutateAsync({
        tripId,
        title: trimmedTitle,
        description: description.trim() || undefined,
        imageUrl: imagePath || undefined,
        isPinned,
      });
    } catch {
      // Error handling is done in the mutation's onError
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Create Activity"
        subtitle="Add custom activity to feed"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FormField label="Title" required>
          <ThemedTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
          />
        </FormField>

        <FormField label="Description">
          <ThemedTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </FormField>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image</Text>
          <View style={styles.imageRow}>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={handlePickImage}
              activeOpacity={0.85}
              disabled={isUploadingImage}
            >
              <Ionicons name="image-outline" size={16} color={colors.primary} />
              <Text style={styles.imagePickerButtonText}>
                {imagePath ? "Change image" : "Add image"}
              </Text>
            </TouchableOpacity>

            {imagePath ? (
              <TouchableOpacity
                style={styles.imageRemoveButton}
                onPress={() => {
                  setImagePath("");
                  setImagePreviewUri(null);
                }}
                activeOpacity={0.85}
                disabled={isUploadingImage}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.imageRemoveButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isUploadingImage ? (
            <Text style={styles.helperText}>
              Uploading image{imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
            </Text>
          ) : null}

          {imagePreviewUri ? (
            <Image source={{ uri: imagePreviewUri }} style={styles.imagePreview} />
          ) : null}

          <Text style={styles.helperText}>Image is optional for custom activity.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publish mode</Text>
          <View style={styles.publishModeRow}>
            <TouchableOpacity
              style={[styles.typeChip, !isPinned && styles.typeChipActive]}
              onPress={() => setIsPinned(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeChipText, !isPinned && styles.typeChipTextActive]}>
                Normal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, isPinned && styles.typeChipActive]}
              onPress={() => setIsPinned(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeChipText, isPinned && styles.typeChipTextActive]}>
                Pin to top
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            Pin to top keeps this post above regular feed entries.
          </Text>
        </View>

        <PrimaryLoadingButton
          label="Create Activity"
          isLoading={createCustomMutation.isPending || isUploadingImage}
          onPress={handleSubmit}
          disabled={!title.trim() || createCustomMutation.isPending || isUploadingImage}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  helperText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  imageRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    backgroundColor: colors.primaryOpacity10,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  imagePickerButtonText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  imageRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  imageRemoveButtonText: {
    color: colors.danger,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  imagePreview: {
    width: "100%",
    height: 140,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    marginTop: spacing.xs,
  },
  publishModeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDarkOpacity80,
    flex: 1,
  },
  typeChipActive: {
    backgroundColor: colors.primaryOpacity20,
    borderColor: colors.primaryOpacity30,
  },
  typeChipText: {
    fontSize: typography.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
  },
});
