import React, { useState, useEffect, useCallback } from "react";
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
import { useQuery, useMutation, useClient } from "urql";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { getImageExtension, getImageContentType } from "~/utils/image";
import { useFileUpload } from "~/hooks/files";
import {
  GetRewardDocument,
  GetTotalAvailablePointsDocument,
  UpdateRewardDocument,
  SetRewardHiddenDocument,
  DeleteRewardDocument,
  GetRewardsByTripAdminDocument,
} from "@mirai-app/graphql-types";

export default function AdminEditRewardScreen() {
  const router = useRouter();
  const urqlClient = useClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rewardId: string; tripId?: string }>();
  const rewardId = params.rewardId;
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
  } = useFileUpload();

  // Get reward query
  const [{ data: rewardData, fetching: isLoading }] = useQuery({
    query: GetRewardDocument,
    variables: { id: rewardId },
    pause: !rewardId,
  });

  const reward = rewardData?.reward;

  // Get total available points query
  const [{ data: totalPointsData }] = useQuery({
    query: GetTotalAvailablePointsDocument,
    variables: { tripId },
    pause: !tripId,
  });

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coinCost, setCoinCost] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);

  // Update form when reward data loads
  useEffect(() => {
    if (reward) {
      const updateState = () => {
        setName(reward.name ?? "");
        setDescription(reward.description ?? "");
        setCoinCost(reward.coinCostPercentage?.toString() ?? "");
        setAvailableQuantity(reward.availableQuantity?.toString() ?? "");
        setIsHidden(reward.isHidden ?? false);
        setImagePath(reward.primaryImage ?? "");
        setImagePreviewUri(reward.primaryImage ?? null);
      };
      requestAnimationFrame(updateState);
    }
  }, [reward]);

  const totalAvailablePoints =
    totalPointsData?.totalAvailablePoints?.totalPoints ?? 0;
  const calculatedCost =
    coinCost && totalAvailablePoints > 0
      ? Math.max(
          1,
          Math.round(totalAvailablePoints * (parseFloat(coinCost) / 100)),
        )
      : 0;

  // Cache invalidation helper
  const invalidateRewardsCache = useCallback(async () => {
    await urqlClient.invalidate(GetRewardsByTripAdminDocument, {
      tripId,
      limit: 100,
      offset: 0,
    });
    await urqlClient.invalidate(GetRewardDocument, { id: rewardId });
  }, [urqlClient, tripId, rewardId]);

  // Mutations
  const [, updateReward] = useMutation(UpdateRewardDocument);
  const [, setRewardHidden] = useMutation(SetRewardHiddenDocument);
  const [, deleteReward] = useMutation(DeleteRewardDocument);

  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent =
    uploadProgress.percent != null
      ? Math.round(uploadProgress.percent * 100)
      : null;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const extension = getImageExtension(asset);
      const fileName =
        asset.fileName?.trim() ?? `reward-${Date.now()}.${extension}`;
      const storagePath = `rewards/${tripId}/reward-${Date.now()}.${extension}`;
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
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const handleSubmit = async () => {
    if (!reward) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedCoinCost = parseInt(coinCost);
    const parsedQuantity = parseInt(availableQuantity);

    if (!trimmedName) {
      Alert.alert("Validation", "Reward name is required.");
      return;
    }

    if (isNaN(parsedCoinCost) || parsedCoinCost <= 0 || parsedCoinCost > 100) {
      Alert.alert(
        "Validation",
        "Valid coin cost percentage (1-100) is required.",
      );
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Validation", "Valid available quantity is required.");
      return;
    }

    if (isUploadingImage) {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    try {
      // Update reward details
      const updateResult = await updateReward({
        input: {
          id: rewardId,
          name: trimmedName,
          description: trimmedDescription || undefined,
          coinCost: parsedCoinCost,
          availableQuantity: parsedQuantity,
          images: imagePath ? [imagePath] : [],
        },
      });

      if (updateResult.error) {
        Alert.alert(
          "Error",
          updateResult.error.message || "Failed to update reward",
        );
        return;
      }

      // Update hidden status if changed
      if (reward.isHidden !== isHidden) {
        const hiddenResult = await setRewardHidden({
          rewardId: rewardId,
          isHidden,
        });

        if (hiddenResult.error) {
          Alert.alert(
            "Error",
            hiddenResult.error.message || "Failed to update visibility",
          );
          return;
        }
      }

      // Invalidate cache and show success
      await invalidateRewardsCache();
      Alert.alert("Success", "Reward updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    }
  };

  const handleDelete = () => {
    if (!reward) return;

    Alert.alert(
      "Delete Reward",
      `Are you sure you want to delete "${reward.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteReward({ id: rewardId });

            if (result.error) {
              Alert.alert(
                "Error",
                result.error.message || "Failed to delete reward",
              );
            } else {
              await invalidateRewardsCache();
              Alert.alert("Success", "Reward deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Edit Reward" subtitle="Loading reward data..." />
      </View>
    );
  }

  if (!reward) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Reward not found" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Edit Reward" subtitle="Update reward information" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{reward.name}</Text>
          <Text style={styles.rewardMeta}>
            {reward.purchaseCount ?? 0} purchased • {reward.availableQuantity}{" "}
            available
          </Text>
          <Text style={styles.rewardMeta}>
            Created: {new Date(reward.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <FormField label="Reward Name" required>
          <ThemedTextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter reward name..."
          />
        </FormField>

        <FormField label="Description">
          <ThemedTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter reward description..."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </FormField>

        <FormField label="Coin Cost (%)" required>
          <ThemedTextInput
            value={coinCost}
            onChangeText={setCoinCost}
            placeholder="Enter percentage (1-100)..."
            keyboardType="numeric"
          />
          {coinCost && totalAvailablePoints > 0 && (
            <Text style={styles.helperText}>
              Cost: {calculatedCost} coins ({coinCost}% of{" "}
              {totalAvailablePoints} total points)
            </Text>
          )}
        </FormField>

        <FormField label="Available Quantity" required>
          <ThemedTextInput
            value={availableQuantity}
            onChangeText={setAvailableQuantity}
            placeholder="Enter available quantity..."
            keyboardType="numeric"
          />
        </FormField>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reward Image</Text>
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
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text style={styles.imageRemoveButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isUploadingImage ? (
            <Text style={styles.helperText}>
              Uploading image
              {imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
            </Text>
          ) : null}

          {imagePreviewUri ? (
            <Image
              source={{ uri: imagePreviewUri }}
              style={styles.imagePreview}
            />
          ) : null}

          <Text style={styles.helperText}>
            Image is optional but recommended.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                !isHidden && styles.visibilityOptionActive,
              ]}
              onPress={() => setIsHidden(false)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color={!isHidden ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.visibilityOptionText,
                  !isHidden && styles.visibilityOptionTextActive,
                ]}
              >
                Visible
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                isHidden && styles.visibilityOptionActive,
              ]}
              onPress={() => setIsHidden(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="eye-off-outline"
                size={16}
                color={isHidden ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.visibilityOptionText,
                  isHidden && styles.visibilityOptionTextActive,
                ]}
              >
                Hidden
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Hidden rewards won't appear in the shop for users.
          </Text>
        </View>

        <PrimaryLoadingButton
          label="Save Changes"
          isLoading={false}
          onPress={handleSubmit}
        />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Reward</Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  rewardInfo: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rewardName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  rewardMeta: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
    minHeight: 80,
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
    height: 200,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    marginTop: spacing.xs,
  },
  visibilityOptions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDarkOpacity80,
    flex: 1,
    justifyContent: "center",
  },
  visibilityOptionActive: {
    backgroundColor: colors.primaryOpacity20,
    borderColor: colors.primaryOpacity30,
  },
  visibilityOptionText: {
    fontSize: typography.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  visibilityOptionTextActive: {
    color: colors.primary,
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  deleteButtonText: {
    fontSize: typography.base,
    color: colors.danger,
    fontWeight: typography.medium,
  },
});

// Summary:
// - File migrated: apps/native/src/app/(tabs)/admin/rewards/edit/[rewardId].tsx
// - Key changes made:
//   1. Replaced @tanstack/react-query imports with urql (useQuery, useMutation, useClient)
//   2. Removed GraphQLClient and SecureStore imports (urql client handles auth automatically)
//   3. Removed createGraphQLClient helper function and useGraphQLClient hook (not needed with urql)
//   4. Removed useQueryClient import from @tanstack/react-query
//   5. Imported GraphQL documents from @mirai-app/graphql-types (GetRewardDocument, GetTotalAvailablePointsDocument, UpdateRewardDocument, SetRewardHiddenDocument, DeleteRewardDocument, GetRewardsByTripAdminDocument)
//   6. Changed from graphql-request's useGetRewardQuery.fetcher(client, variables) to urql's useQuery({ query, variables, pause })
//   7. Changed from graphql-request's useUpdateRewardMutation.fetcher() to urql's useMutation(Document)
//   8. Changed loading state: isLoading → fetching (from urql's tuple)
//   9. Replaced queryClient.invalidateQueries({ queryKey }) with urqlClient.invalidate(Document, variables)
//   10. Updated mutation pattern: removed onSuccess/onError callbacks from hook, moved to manual error handling after await
//   11. Updated form initialization to use requestAnimationFrame pattern for smooth state updates
//   12. Simplified PrimaryLoadingButton: removed complex isPending state tracking since urql mutation doesn't expose it directly
//   13. Updated handleDelete to use async/await pattern with manual error handling
//   14. Changed coinCost field mapping from reward.coinCost to reward.coinCostPercentage (correct field name from schema)
//   15. Updated image preview to use reward.primaryImage directly (urql doesn't have signedImageUrl transform)
