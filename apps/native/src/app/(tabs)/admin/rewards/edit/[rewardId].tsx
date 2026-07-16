import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { DeckBackground } from "~/components/common/DeckBackground";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { useFileUpload } from "~/hooks/files";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import { getFileContentType, getFileExtension } from "~/utils/image";

export default function AdminEditRewardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ rewardId: string; tripId?: string }>();
  const rewardId = params.rewardId;
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();

  const { data: reward, isLoading } = useQuery(
    orpc.reward.getById.queryOptions({ input: { id: rewardId }, enabled: !!rewardId }),
  );

  const { data: totalPointsData } = useQuery(
    orpc.reward.getTotalAvailablePoints.queryOptions({ input: { tripId }, enabled: !!tripId }),
  );

  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [coinCost, setCoinCost] = useState(
    reward?.originalCoinCost?.toString() ?? reward?.coinCost.toString() ?? "",
  );
  const [availableQuantity, setAvailableQuantity] = useState(
    reward?.availableQuantity.toString() ?? "",
  );
  const [isHidden, setIsHidden] = useState(reward?.isHidden ?? false);
  const [imagePath, setImagePath] = useState(reward?.image ?? "");
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(
    reward?.signedImageUrl ?? null,
  );

  const totalAvailablePoints = totalPointsData?.totalPoints ?? 0;
  const calculatedCost =
    coinCost && totalAvailablePoints > 0
      ? Math.max(1, Math.round(totalAvailablePoints * (Number.parseFloat(coinCost) / 100)))
      : 0;

  const updateRewardMutation = useMutation(
    orpc.reward.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getById"], { input: { id: rewardId } }],
        });
        Alert.alert("Success", "Reward updated successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const setHiddenMutation = useMutation(
    orpc.reward.setHidden.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getById"], { input: { id: rewardId } }],
        });
      },
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const deleteRewardMutation = useMutation(
    orpc.reward.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getAll"], { input: { tripId } }],
        });
        Alert.alert("Success", "Reward deleted successfully.", [
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
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const extension = getFileExtension(asset);
      const fileName = asset.fileName?.trim() ?? `reward-${Date.now()}.${extension}`;
      const storagePath = `rewards/${tripId}/reward-${Date.now()}.${extension}`;
      const contentType = asset.mimeType ?? getFileContentType(extension);

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
    if (!reward) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedCoinCost = Number.parseInt(coinCost);
    const parsedQuantity = Number.parseInt(availableQuantity);

    if (!trimmedName) {
      Alert.alert("Validation", "Reward name is required.");
      return;
    }

    if (Number.isNaN(parsedCoinCost) || parsedCoinCost <= 0 || parsedCoinCost > 100) {
      Alert.alert("Validation", "Valid coin cost percentage (1-100) is required.");
      return;
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Validation", "Valid available quantity is required.");
      return;
    }

    if (isUploadingImage) {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    try {
      // Update reward details
      await updateRewardMutation.mutateAsync({
        id: rewardId,
        name: trimmedName,
        description: trimmedDescription || undefined,
        coinCost: parsedCoinCost,
        availableQuantity: parsedQuantity,
        image: imagePath || undefined,
      });

      // Update hidden status if changed
      if (reward.isHidden !== isHidden) {
        await setHiddenMutation.mutateAsync({
          id: rewardId,
          isHidden,
        });
      }
    } catch {
      // Error handling is done in the mutation's onError
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
          onPress: () => {
            void deleteRewardMutation.mutateAsync({ id: rewardId });
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
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />
      <DeckBackground />

      <AdminHeader title="Edit Reward" subtitle="Update reward information" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{reward.name}</Text>
          <Text style={styles.rewardMeta}>
            {reward.purchasedCount ?? 0} purchased • {reward.availableQuantity} available
          </Text>
          <Text style={styles.rewardMeta}>
            Created: {new Date(reward.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <FormField label="Reward Name" required={true}>
          <ThemedTextInput value={name} onChangeText={setName} placeholder="Enter reward name..." />
        </FormField>

        <FormField label="Description">
          <ThemedTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter reward description..."
            multiline={true}
            numberOfLines={3}
            style={styles.textArea}
          />
        </FormField>

        <FormField label="Coin Cost (%)" required={true}>
          <ThemedTextInput
            value={coinCost}
            onChangeText={setCoinCost}
            placeholder="Enter percentage (1-100)..."
            keyboardType="numeric"
          />
          {coinCost && totalAvailablePoints > 0 && (
            <Text style={styles.helperText}>
              Cost: {calculatedCost} coins ({coinCost}% of {totalAvailablePoints} total points)
            </Text>
          )}
        </FormField>

        <FormField label="Available Quantity" required={true}>
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
              <Ionicons name="image-outline" size={16} color={palette.primary} />
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

          <Text style={styles.helperText}>Image is optional but recommended.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[styles.visibilityOption, !isHidden && styles.visibilityOptionActive]}
              onPress={() => setIsHidden(false)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color={isHidden ? colors.textSecondary : palette.primary}
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
              style={[styles.visibilityOption, isHidden && styles.visibilityOptionActive]}
              onPress={() => setIsHidden(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="eye-off-outline"
                size={16}
                color={isHidden ? palette.primary : colors.textSecondary}
              />
              <Text
                style={[styles.visibilityOptionText, isHidden && styles.visibilityOptionTextActive]}
              >
                Hidden
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Hidden rewards won't appear in the shop for users.</Text>
        </View>

        <PrimaryLoadingButton
          label="Save Changes"
          isLoading={updateRewardMutation.isPending}
          onPress={handleSubmit}
          disabled={updateRewardMutation.isPending}
        />

        <TouchableOpacity
          style={[
            styles.deleteButton,
            deleteRewardMutation.isPending && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={deleteRewardMutation.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteRewardMutation.isPending ? "Deleting..." : "Delete Reward"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 96,
      gap: spacing.md,
    },
    rewardInfo: {
      backgroundColor: palette.cardDark,
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
      backgroundColor: palette.cardDark,
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
      borderColor: palette.primaryOpacity30,
      backgroundColor: palette.primaryOpacity10,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    imagePickerButtonText: {
      color: palette.primary,
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
      backgroundColor: palette.primaryOpacity20,
      borderColor: palette.primaryOpacity30,
    },
    visibilityOptionText: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    visibilityOptionTextActive: {
      color: palette.primary,
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
    deleteButtonDisabled: {
      opacity: 0.5,
    },
    deleteButtonText: {
      fontSize: typography.base,
      color: colors.danger,
      fontWeight: typography.medium,
    },
  });
}
