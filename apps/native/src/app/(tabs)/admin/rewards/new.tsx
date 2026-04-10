import React, { useState, useCallback } from "react";
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
  GetTotalAvailablePointsDocument,
  CreateRewardDocument,
  GetRewardsByTripAdminDocument,
} from "@mirai-app/graphql-types";

export default function AdminCreateRewardScreen() {
  const router = useRouter();
  const urqlClient = useClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  // GraphQL Query: Get total available points
  const [{ data: totalPointsData }] = useQuery({
    query: GetTotalAvailablePointsDocument,
    variables: { tripId },
    pause: !tripId,
  });

  const totalAvailablePoints =
    totalPointsData?.totalAvailablePoints?.totalPoints ?? 0;

  const {
    upload,
    reset: resetUpload,
    status: uploadStatus,
    progress: uploadProgress,
  } = useFileUpload();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coinCost, setCoinCost] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const calculatedCost =
    coinCost && totalAvailablePoints > 0
      ? Math.max(
          1,
          Math.round(totalAvailablePoints * (parseFloat(coinCost) / 100)),
        )
      : 0;

  // GraphQL Mutation: Create reward
  const [, createReward] = useMutation(CreateRewardDocument);

  // Cache invalidation helper
  const invalidateRewardsCache = useCallback(async () => {
    await urqlClient.invalidate(GetRewardsByTripAdminDocument, {
      tripId,
      limit: 100,
      offset: 0,
    });
  }, [urqlClient, tripId]);

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
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedCoinCost = parseInt(coinCost);
    const parsedQuantity = parseInt(availableQuantity);

    if (!trimmedName) {
      Alert.alert("Validation", "Reward name is required.");
      return;
    }

    if (!trimmedDescription) {
      Alert.alert("Validation", "Reward description is required.");
      return;
    }

    if (!tripId) {
      Alert.alert("Error", "Trip context is required.");
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

    setIsCreating(true);

    try {
      const result = await createReward({
        input: {
          name: trimmedName,
          description: trimmedDescription,
          coinCost: parsedCoinCost,
          availableQuantity: parsedQuantity,
          tripId,
          images: imagePath ? [imagePath] : [],
          isHidden,
        },
      });

      if (result.error) {
        Alert.alert("Error", result.error.message || "Failed to create reward");
        return;
      }

      // Success - invalidate cache and reset form
      await invalidateRewardsCache();
      setName("");
      setDescription("");
      setCoinCost("");
      setAvailableQuantity("");
      setIsHidden(false);
      setImagePath("");
      setImagePreviewUri(null);
      resetUpload();
      Alert.alert("Success", "Reward created successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create reward",
      );
    } finally {
      setIsCreating(false);
    }
  };

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

      <AdminHeader
        title="Create Reward"
        subtitle="Add new reward to the shop"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
          label="Create Reward"
          isLoading={isCreating || isUploadingImage}
          onPress={handleSubmit}
          disabled={
            !name.trim() ||
            !coinCost.trim() ||
            !availableQuantity.trim() ||
            isCreating ||
            isUploadingImage
          }
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
});
