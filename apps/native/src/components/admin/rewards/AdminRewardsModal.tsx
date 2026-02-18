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
  image: string;
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

export default function AdminRewardsModal({ visible, onClose, tripId }: Props) {
  const createReward = useCreateReward();
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);

  const [newReward, setNewReward] = useState<NewRewardState>({
    name: "",
    description: "",
    availableQuantity: "",
    coinCost: "",
    image: "",
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
        image: newReward.image || undefined,
        isHidden: newReward.isHidden,
        tripId: tripIdToUse,
      });

      setNewReward({
        name: "",
        description: "",
        availableQuantity: "",
        coinCost: "",
        image: "",
        isHidden: false,
      });
      setImagePreviewUri(null);
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const extension = getImageExtension(asset);
        const fileName =
          asset.fileName?.trim() ??
          `reward-image-${Date.now()}.${extension}`;
        
        const storagePath = `rewards/${fileName}`;
        const contentType = getImageContentType(extension);

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName,
          contentType,
        });

        setNewReward((prev) => ({ ...prev, image: storagePath }));
        setImagePreviewUri(asset.uri);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
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
              Reward image (optional)
            </Text>
            
            {newReward.image ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: imagePreviewUri ?? newReward.image }}
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 12,
                    backgroundColor: "#0f2323",
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => {
                    setNewReward({ ...newReward, image: "" });
                    setImagePreviewUri(null);
                  }}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 16,
                    padding: 4,
                  }}
                >
                  <Ionicons name="close" size={16} color="#fff" />
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
                      Add image
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
