import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "~/styles/commonStyles";
import {
  useDeleteReward,
  useReward,
  useUpdateReward,
} from "~/hooks/rewards";
import * as ImagePicker from "expo-image-picker";
import { useFileUpload } from "~/hooks/files";

interface Props {
  rewardId: string | null;
  onClose: () => void;
}

export default function AdminRewardDetailModal({ rewardId, onClose }: Props) {
  const { upload, status: uploadStatus } = useFileUpload();

  // Avoid firing queries without an id
  if (!rewardId) return null;

  const { data: reward, isLoading } = useReward(rewardId);
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const [form, setForm] = useState({
    name: "",
    description: "",
    availableQuantity: "",
    coinCost: "",
    image: "",
  });

  useEffect(() => {
    if (reward) {
      setForm({
        name: reward.name,
        description: reward.description,
        availableQuantity: String(reward.availableQuantity),
        coinCost: String(reward.coinCost),
        image: reward.image ?? "",
      });
    }
  }, [reward]);

  const purchasedCount = useMemo(() => reward?.purchases?.length ?? 0, [reward]);

  const handleSave = async () => {
    if (!form.name || !form.description || !form.availableQuantity || !form.coinCost) {
      Alert.alert("Błąd", "Wypełnij wszystkie wymagane pola");
      return;
    }

    try {
      await updateReward.mutateAsync({
        id: rewardId,
        name: form.name,
        description: form.description,
        availableQuantity: parseInt(form.availableQuantity, 10),
        coinCost: parseInt(form.coinCost, 10),
        image: form.image || null,
      });
      Alert.alert("Zapisano", "Nagroda została zaktualizowana");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się zapisać";
      Alert.alert("Błąd", message);
    }
  };

  const handleDelete = () => {
    if (!rewardId) return;

    Alert.alert(
      "Usuń nagrodę",
      "Czy na pewno chcesz usunąć tę nagrodę?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReward.mutateAsync({ id: rewardId });
              Alert.alert("Usunięto", "Nagroda została usunięta");
              onClose();
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Nie udało się usunąć nagrody";
              Alert.alert("Błąd", message);
            }
          },
        },
      ],
    );
  };

  const isMutating = updateReward.isPending || deleteReward.isPending;
  const isUploadingImage = uploadStatus === "uploading";

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
        const extension = (asset.fileName?.split(".").pop() ?? "jpg").toLowerCase();
        const fileName = asset.fileName?.trim() ?? `reward-image-${Date.now()}.${extension}`;
        const storagePath = `rewards/${fileName}`;

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName,
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

        setForm((prev) => ({ ...prev, image: storagePath }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się przesłać zdjęcia";
      Alert.alert("Błąd", message);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await updateReward.mutateAsync({ id: rewardId, image: null });
      setForm((prev) => ({ ...prev, image: "" }));
      Alert.alert("Usunięto", "Obraz nagrody został usunięty");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się usunąć zdjęcia";
      Alert.alert("Błąd", message);
    }
  };

  return (
    <Modal
      visible={!!rewardId}
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
          <View>
            <Text style={[commonStyles.h3]}>Szczegóły nagrody</Text>
            {reward && (
              <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginTop: 4 }]}>
                Utworzona: {new Date(reward.createdAt).toLocaleDateString()} | {reward.createdBy?.firstName} {reward.createdBy?.lastName}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} disabled={isMutating}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {isLoading || !reward ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#00ced1" />
          </View>
        ) : (
          <ScrollView style={{ padding: 24 }}>
            {(reward.signedImageUrl ?? reward.image ?? form.image) && (
              <View style={{ marginBottom: 24 }}>
                <Image
                  source={{ uri: reward.signedImageUrl ?? reward.image ?? form.image }}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: "#0f2323" }}
                  resizeMode="cover"
                />
                <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={isUploadingImage}
                    style={{
                      flex: 1,
                      backgroundColor: "#00ced1",
                      padding: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={commonStyles.buttonText}>Zmień obraz</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveImage}
                    disabled={isMutating}
                    style={{
                      backgroundColor: "#ef4444",
                      padding: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={commonStyles.buttonText}>Usuń obraz</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!reward.image && !form.image && (
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingImage}
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 24,
                  alignItems: "center",
                }}
              >
                {isUploadingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={commonStyles.buttonText}>Dodaj obraz</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>Nazwa</Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                }}
                placeholder="Nazwa nagrody"
                placeholderTextColor="#6b7280"
                value={form.name}
                onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>Opis</Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Opis nagrody"
                placeholderTextColor="#6b7280"
                multiline
                value={form.description}
                onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.label, { marginBottom: 8 }]}>Dostępna ilość</Text>
                <TextInput
                  keyboardType="numeric"
                  style={{
                    backgroundColor: "#0f2323",
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    borderRadius: 12,
                    padding: 12,
                    color: "#fff",
                  }}
                  value={form.availableQuantity}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, availableQuantity: text }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.label, { marginBottom: 8 }]}>Koszt (monety)</Text>
                <TextInput
                  keyboardType="numeric"
                  style={{
                    backgroundColor: "#0f2323",
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    borderRadius: 12,
                    padding: 12,
                    color: "#fff",
                  }}
                  value={form.coinCost}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, coinCost: text }))}
                />
              </View>
            </View>

            <View style={{ marginBottom: 24, gap: 8 }}>
              <Text style={[commonStyles.label]}>Zakupione</Text>
              <Text style={[commonStyles.textSecondary, { color: "#9ca3af" }]}>
                {purchasedCount} zakupionych
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isMutating}
                style={{
                  flex: 1,
                  backgroundColor: isMutating ? "#0f4a4a" : "#00ced1",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                {updateReward.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={commonStyles.buttonText}>Zapisz zmiany</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                disabled={isMutating}
                style={{
                  backgroundColor: "#ef4444",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                {deleteReward.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={commonStyles.buttonText}>Usuń</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
