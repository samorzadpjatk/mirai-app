import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCreateReward } from "~/hooks/rewards";
import { useFileUpload } from "~/hooks/files";
import { commonStyles } from "~/styles/commonStyles";

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId?: string | null;
}

interface NewRewardState {
  name: string;
  description: string;
  availableQuantity: string;
  coinCost: string;
  images: string[];
  isHidden: boolean;
}

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
  if (contentType === "image/heic" || contentType === "image/heif") {
    return "heic";
  }
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
  const imageUploadPercent = uploadProgress.percent != null
    ? Math.round(uploadProgress.percent * 100)
    : null;

  const handleCreate = async () => {
    if (!tripIdToUse || tripIdToUse === "all") {
      Alert.alert("Error", "Select a trip in the admin panel first");
      return;
    }

    if (!newReward.name || !newReward.description || !newReward.availableQuantity || 
        !newReward.coinCost) {
      Alert.alert("Error", "Fill in all required fields");
      return;
    }

    try {
      await createReward.mutateAsync({
        name: newReward.name,
        description: newReward.description,
        availableQuantity: parseInt(newReward.availableQuantity, 10),
        coinCost: parseInt(newReward.coinCost, 10),
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
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const handleRemoveImage = (index: number) => {
    setNewReward((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }));
    setImagePreviewUris((prev) =>
      prev.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={commonStyles.container}>
        <View style={{
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: "#273a3a",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Text style={[commonStyles.h3]}>New Reward</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 24 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>
              Reward name
            </Text>
            <TextInput
              style={{
                backgroundColor: "#0f2323",
                borderWidth: 1,
                borderColor: "#273a3a",
                borderRadius: 12,
                padding: 12,
                color: "#fff",
              }}
              placeholder="e.g. Branded T-shirt"
              placeholderTextColor="#6b7280"
              value={newReward.name}
              onChangeText={(text) => setNewReward({ ...newReward, name: text })}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>
              Description
            </Text>
            <TextInput
              style={{
                backgroundColor: "#0f2323",
                borderWidth: 1,
                borderColor: "#273a3a",
                borderRadius: 12,
                padding: 12,
                color: "#fff",
                textAlignVertical: "top",
              }}
              placeholder="Describe the reward"
              placeholderTextColor="#6b7280"
              value={newReward.description}
              onChangeText={(text) => setNewReward({ ...newReward, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                Available quantity
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                }}
                placeholder="0"
                placeholderTextColor="#6b7280"
                value={newReward.availableQuantity}
                onChangeText={(text) => setNewReward({ ...newReward, availableQuantity: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                Cost in coins
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                }}
                placeholder="0"
                placeholderTextColor="#6b7280"
                value={newReward.coinCost}
                onChangeText={(text) => setNewReward({ ...newReward, coinCost: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>
              Visibility
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setNewReward((prev) => ({ ...prev, isHidden: false }))}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: !newReward.isHidden ? "#22c55e" : "#273a3a",
                  backgroundColor: !newReward.isHidden ? "rgba(34, 197, 94, 0.14)" : "#0f2323",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={[commonStyles.label, { color: !newReward.isHidden ? "#22c55e" : "#9ca3af", letterSpacing: 0.8 }]}>
                  Visible
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewReward((prev) => ({ ...prev, isHidden: true }))}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: newReward.isHidden ? "#ef4444" : "#273a3a",
                  backgroundColor: newReward.isHidden ? "rgba(239, 68, 68, 0.14)" : "#0f2323",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={[commonStyles.label, { color: newReward.isHidden ? "#ef4444" : "#9ca3af", letterSpacing: 0.8 }]}>
                  Hidden
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>
              Reward images (optional)
            </Text>
            
            {newReward.images.length > 0 ? (
              <View style={{ gap: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {newReward.images.map((imagePath, index) => (
                    <View key={`${imagePath}-${index}`} style={{ position: "relative" }}>
                      <Image
                        source={{ uri: imagePreviewUris[index] ?? imagePath }}
                        style={{
                          width: 110,
                          height: 110,
                          borderRadius: 12,
                          backgroundColor: "#0f2323",
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveImage(index)}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          backgroundColor: "rgba(0,0,0,0.75)",
                          borderRadius: 16,
                          padding: 4,
                        }}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={isUploadingImage}
                  style={{
                    backgroundColor: "#0f2323",
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isUploadingImage ? (
                    <View style={{ alignItems: "center" }}>
                      <ActivityIndicator size="small" color="#00ced1" />
                      <Text style={{ color: "#9ca3af", marginTop: 8, fontSize: 12 }}>
                        Uploading{imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: "#9ca3af" }}>Add more images</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingImage}
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isUploadingImage ? (
                  <View style={{ alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#00ced1" />
                    <Text style={{ color: "#9ca3af", marginTop: 8, fontSize: 12 }}>
                      Uploading{imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="image" size={24} color="#6b7280" />
                    <Text style={{ color: "#6b7280", marginTop: 8 }}>
                      Add images
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={createReward.isPending}
            style={[commonStyles.button, { marginBottom: 24 }]}
          >
            <Text style={commonStyles.buttonText}>
              {createReward.isPending ? "Creating..." : "Create reward"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
