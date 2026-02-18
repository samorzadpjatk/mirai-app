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
  tripName?: string | null;
}

interface NewRewardState {
  name: string;
  description: string;
  availableQuantity: string;
  coinCost: string;
  image: string;
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

export default function AdminRewardsModal({ visible, onClose, tripId, tripName }: Props) {
  const createReward = useCreateReward();
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();

  const [newReward, setNewReward] = useState<NewRewardState>({
    name: "",
    description: "",
    availableQuantity: "",
    coinCost: "",
    image: "",
  });

  const tripIdToUse = tripId ?? "";

  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent = uploadProgress.percent != null
    ? Math.round(uploadProgress.percent * 100)
    : null;

  const handleCreate = async () => {
    if (!tripIdToUse || tripIdToUse === "all") {
      Alert.alert("Błąd", "Wybierz najpierw wycieczkę w panelu admina");
      return;
    }

    if (!newReward.name || !newReward.description || !newReward.availableQuantity || 
        !newReward.coinCost) {
      Alert.alert("Błąd", "Wypełnij wszystkie wymagane pola");
      return;
    }

    try {
      await createReward.mutateAsync({
        name: newReward.name,
        description: newReward.description,
        availableQuantity: parseInt(newReward.availableQuantity),
        coinCost: parseInt(newReward.coinCost),
        image: newReward.image || undefined,
        tripId: tripIdToUse,
      });

      setNewReward({
        name: "",
        description: "",
        availableQuantity: "",
        coinCost: "",
        image: "",
      });
      Alert.alert("Sukces", "Nagroda została utworzona");
      onClose();
    } catch {
      Alert.alert("Błąd", "Nie udało się utworzyć nagrody");
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
          <Text style={[commonStyles.h3]}>Nowa nagroda</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 24 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>
              Nazwa nagrody
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
              placeholder="np. Koszulka z logo"
              placeholderTextColor="#6b7280"
              value={newReward.name}
              onChangeText={(text) => setNewReward({ ...newReward, name: text })}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>Wycieczka</Text>
            <View
              style={{
                backgroundColor: "#0f2323",
                borderWidth: 1,
                borderColor: "#273a3a",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text style={{ color: tripIdToUse ? "#fff" : "#f87171" }}>
                {tripName ?? (tripIdToUse && tripIdToUse !== "all"
                  ? "Wybrana wycieczka"
                  : "Brak wybranej wycieczki")}
              </Text>
              <Text style={{ color: "#6b7280", marginTop: 4, fontSize: 12 }}>
                Wybierz wycieczkę w panelu admina przed dodaniem nagrody
              </Text>
            </View>
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={[commonStyles.label, { marginBottom: 8 }]}>
              Opis
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
              placeholder="Opisz nagrodę"
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
                Dostępna ilość
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
                Koszt w monetach
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
              Obrazek nagrody (opcjonalnie)
            </Text>
            
            {newReward.image ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: newReward.image }}
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 12,
                    backgroundColor: "#0f2323",
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setNewReward({ ...newReward, image: "" })}
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
                      Dodaj obrazek
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
              {createReward.isPending ? "Tworzenie..." : "Utwórz nagrodę"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
