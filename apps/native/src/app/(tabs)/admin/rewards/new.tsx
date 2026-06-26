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
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { useFileUpload } from "~/hooks/files";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { getFileContentType, getFileExtension } from "~/utils/image";

export default function AdminCreateRewardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const { data: totalPointsData } = useQuery(
    orpc.reward.getTotalAvailablePoints.queryOptions({ input: { tripId }, enabled: !!tripId }),
  );

  const totalAvailablePoints = totalPointsData?.totalPoints ?? 0;

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
  const [imagePreviewUri, setImagePreviewUri] = useState<string>("");

  const calculatedCost =
    coinCost && totalAvailablePoints > 0
      ? Math.max(1, Math.round(totalAvailablePoints * (Number.parseFloat(coinCost) / 100)))
      : 0;

  const createRewardMutation = useMutation(
    orpc.reward.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["reward", "getAll"], { input: { tripId } }],
        });
        setName("");
        setDescription("");
        setCoinCost("");
        setAvailableQuantity("");
        setIsHidden(false);
        setImagePath("");
        setImagePreviewUri("");
        resetUpload();
        Alert.alert("Success", "Reward created successfully.", [
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
    uploadProgress.percent == null ? null : Math.round(uploadProgress.percent * 100);

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
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedCoinCost = Number.parseInt(coinCost, 10);
    const parsedQuantity = Number.parseInt(availableQuantity, 10);

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
      await createRewardMutation.mutateAsync({
        name: trimmedName,
        description: trimmedDescription,
        coinCost: parsedCoinCost,
        availableQuantity: parsedQuantity,
        tripId,
        image: imagePath || undefined,
        isHidden,
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

      <AdminHeader title="Create Reward" subtitle="Add new reward to the shop" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
                  setImagePreviewUri("");
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
              Uploading image{imageUploadPercent == null ? "..." : ` ${imageUploadPercent}%`}
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
                color={isHidden ? colors.textSecondary : colors.primary}
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
                color={isHidden ? colors.primary : colors.textSecondary}
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
          label="Create Reward"
          isLoading={createRewardMutation.isPending || isUploadingImage}
          onPress={handleSubmit}
          disabled={
            !name.trim() ||
            !coinCost.trim() ||
            !availableQuantity.trim() ||
            createRewardMutation.isPending ||
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
    paddingBottom: 96,
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
