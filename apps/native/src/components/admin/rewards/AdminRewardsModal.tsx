import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCreateReward } from "~/hooks/rewards";
import { useFileUpload } from "~/hooks/files";
import { getImageExtension, getImageContentType } from "~/utils/image";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { AppModalShell, AppModalFooter, FormField, ThemedTextInput } from "~/components/common/ui";

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId?: string | null;
}

interface NewRewardState {
  name: string;
  description: string;
  availableQuantity: string;
  coinCost: string; // Now represents percentage
  images: string[];
  isHidden: boolean;
}

const buildUniqueRewardImageName = (asset: ImagePicker.ImagePickerAsset, index: number) => {
  const extension = getImageExtension(asset);
  const baseName = (asset.fileName?.split(".").slice(0, -1).join(".") ?? "reward-image")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeBaseName = baseName.length > 0 ? baseName : "reward-image";
  const suffix = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
  return `${safeBaseName}-${suffix}.${extension}`;
};

export default function AdminRewardsModal({ visible, onClose, tripId }: Props) {
  const createReward = useCreateReward();
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();
  const [imagePreviewUris, setImagePreviewUris] = useState<string[]>([]);

  const [newReward, setNewReward] = useState<NewRewardState>({
    name: "",
    description: "",
    availableQuantity: "",
    coinCost: "",
    images: [],
    isHidden: false,
  });

  const tripIdToUse = tripId ?? "";

  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent =
    uploadProgress.percent != null ? Math.round(uploadProgress.percent * 100) : null;

  const handleCreate = async () => {
    if (!tripIdToUse || tripIdToUse === "all") {
      Alert.alert("Error", "Select a trip in the admin panel first");
      return;
    }

    if (
      !newReward.name ||
      !newReward.description ||
      !newReward.availableQuantity ||
      !newReward.coinCost
    ) {
      Alert.alert("Error", "Fill in all required fields");
      return;
    }

    const coinCostPercentage = parseInt(newReward.coinCost, 10);
    if (isNaN(coinCostPercentage) || coinCostPercentage < 1 || coinCostPercentage > 100) {
      Alert.alert("Error", "Cost must be between 1% and 100%");
      return;
    }

    try {
      await createReward.mutateAsync({
        name: newReward.name,
        description: newReward.description,
        availableQuantity: parseInt(newReward.availableQuantity, 10),
        coinCost: coinCostPercentage, // Store as percentage
        images: newReward.images,
        isHidden: newReward.isHidden,
        tripId: tripIdToUse,
      });

      setNewReward({
        name: "",
        description: "",
        availableQuantity: "",
        coinCost: "",
        images: [],
        isHidden: false,
      });
      setImagePreviewUris([]);
      Alert.alert("Success", "Reward has been created");
      onClose();
    } catch {
      Alert.alert("Error", "Failed to create reward");
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) return;

      const nextStoragePaths: string[] = [];
      const nextPreviewUris: string[] = [];

      for (const [index, asset] of result.assets.entries()) {
        const fileName = buildUniqueRewardImageName(asset, index);
        const storagePath = `rewards/${fileName}`;
        const contentType = getImageContentType(getImageExtension(asset));

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName,
          contentType,
          upsert: true,
        });

        nextStoragePaths.push(storagePath);
        nextPreviewUris.push(asset.uri);
      }

      setNewReward((prev) => ({
        ...prev,
        images: [...prev.images, ...nextStoragePaths],
      }));
      setImagePreviewUris((prev) => [...prev, ...nextPreviewUris]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const handleRemoveImage = (index: number) => {
    setNewReward((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }));
    setImagePreviewUris((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  return (
    <AppModalShell visible={visible} title="New Reward" onClose={onClose} variant="pageSheet">
      <ScrollView style={{ padding: spacing.lg }}>
        <FormField label="Reward name" required>
          <ThemedTextInput
            placeholder="e.g. Branded T-shirt"
            value={newReward.name}
            onChangeText={(text) => setNewReward({ ...newReward, name: text })}
          />
        </FormField>

        <FormField label="Description" required>
          <ThemedTextInput
            value={newReward.description}
            onChangeText={(text) => setNewReward({ ...newReward, description: text })}
            multiline
          />
        </FormField>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <FormField label="Available quantity" required style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="0"
              value={newReward.availableQuantity}
              onChangeText={(text) => setNewReward({ ...newReward, availableQuantity: text })}
              keyboardType="numeric"
            />
          </FormField>
          <FormField label="Cost (% of total points)" required style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder="5"
              value={newReward.coinCost}
              onChangeText={(text) => setNewReward({ ...newReward, coinCost: text })}
              keyboardType="numeric"
            />
            <Text
              style={{
                fontSize: typography.xs,
                marginTop: spacing.xs,
                color: colors.textSecondary,
              }}
            >
              Percentage of total available points
            </Text>
          </FormField>
        </View>

        <FormField label="Visibility">
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setNewReward((prev) => ({ ...prev, isHidden: false }))}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: !newReward.isHidden ? colors.success : colors.borderDark,
                backgroundColor: !newReward.isHidden ? colors.primaryOpacity10 : colors.cardDark,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: !newReward.isHidden ? colors.success : colors.textSecondary,
                  letterSpacing: 0.8,
                  fontWeight: typography.semibold,
                }}
              >
                Visible
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setNewReward((prev) => ({ ...prev, isHidden: true }))}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: newReward.isHidden ? colors.danger : colors.borderDark,
                backgroundColor: newReward.isHidden ? colors.red900Opacity30 : colors.cardDark,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: newReward.isHidden ? colors.danger : colors.textSecondary,
                  letterSpacing: 0.8,
                  fontWeight: typography.semibold,
                }}
              >
                Hidden
              </Text>
            </TouchableOpacity>
          </View>
        </FormField>

        <FormField label="Reward images (optional)">
          {newReward.images.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm }}
              >
                {newReward.images.map((imagePath, index) => (
                  <View key={`${imagePath}-${index}`} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: imagePreviewUris[index] ?? imagePath }}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: borderRadius.md,
                        backgroundColor: colors.cardDark,
                      }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      style={{
                        position: "absolute",
                        top: spacing.xs,
                        right: spacing.xs,
                        backgroundColor: "rgba(0,0,0,0.75)",
                        borderRadius: 16,
                        padding: spacing.xs,
                      }}
                    >
                      <Ionicons name="close" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingImage}
                style={{
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isUploadingImage ? (
                  <View style={{ alignItems: "center" }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginTop: spacing.sm,
                        fontSize: typography.xs,
                      }}
                    >
                      Uploading{imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.textSecondary }}>Add more images</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isUploadingImage}
              style={{
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                borderRadius: borderRadius.md,
                padding: spacing.xl,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isUploadingImage ? (
                <View style={{ alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      marginTop: spacing.sm,
                      fontSize: typography.xs,
                    }}
                  >
                    Uploading{imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Ionicons name="image" size={24} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
                    Add images
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </FormField>
      </ScrollView>
      <AppModalFooter
        primaryLabel={createReward.isPending ? "Creating..." : "Create reward"}
        onPrimary={handleCreate}
        isPrimaryLoading={createReward.isPending}
        secondaryLabel="Cancel"
        onSecondary={onClose}
      />
    </AppModalShell>
  );
}
