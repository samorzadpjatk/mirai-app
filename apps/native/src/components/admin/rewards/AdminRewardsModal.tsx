import React, { useState, useEffect } from "react";
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
import { useRewards, useCreateReward, useUpdateReward, useDeleteReward } from "~/hooks/rewards";
import { useTrips } from "~/hooks/trips";
import { useFileUpload } from "~/hooks/files";
import { commonStyles } from "~/styles/commonStyles";

interface Props {
  visible: boolean;
  onClose: () => void;
  showCreateForm?: boolean;
}

interface NewRewardState {
  name: string;
  description: string;
  availableQuantity: string;
  coinCost: string;
  image: string;
  tripId: string;
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

export default function AdminRewardsModal({ visible, onClose, showCreateForm = false }: Props) {
  const { data: rewards, isLoading } = useRewards("all"); // We'll need to modify this to get all rewards
  const { data: trips } = useTrips();
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();
  
  const [showCreateModal, setShowCreateModal] = useState(showCreateForm);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [newReward, setNewReward] = useState<NewRewardState>({
    name: "",
    description: "",
    availableQuantity: "",
    coinCost: "",
    image: "",
    tripId: "",
  });

  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent = uploadProgress.percent != null
    ? Math.round(uploadProgress.percent * 100)
    : null;

  useEffect(() => {
    if (visible) {
      setShowCreateModal(showCreateForm);
    }
  }, [visible, showCreateForm]);

  const handleCreate = async () => {
    if (!newReward.name || !newReward.description || !newReward.availableQuantity || 
        !newReward.coinCost || !newReward.tripId) {
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
        tripId: newReward.tripId,
      });

      setNewReward({
        name: "",
        description: "",
        availableQuantity: "",
        coinCost: "",
        image: "",
        tripId: "",
      });
      setShowCreateModal(false);
      Alert.alert("Sukces", "Nagroda została utworzona");
    } catch (error) {
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
          asset.fileName?.trim() ||
          `reward-image-${Date.now()}.${extension}`;
        
        const storagePath = `rewards/${fileName}`;
        const contentType = getImageContentType(extension);

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName,
          contentType,
        });

        setNewReward({ ...newReward, image: storagePath });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const handleUpdate = async () => {
    if (!editingReward) return;

    try {
      await updateReward.mutateAsync({
        id: editingReward.id,
        name: editingReward.name,
        description: editingReward.description,
        availableQuantity: editingReward.availableQuantity,
        coinCost: editingReward.coinCost,
        image: editingReward.image,
      });

      setEditingReward(null);
      Alert.alert("Sukces", "Nagroda została zaktualizowana");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zaktualizować nagrody");
    }
  };

  const handleDelete = async (rewardId: string) => {
    Alert.alert(
      "Potwierdzenie",
      "Czy na pewno chcesz usunąć tę nagrodę?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReward.mutateAsync({ id: rewardId });
              Alert.alert("Sukces", "Nagroda została usunięta");
            } catch (error) {
              Alert.alert("Błąd", "Nie udało się usunąć nagrody");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (reward: any) => {
    setEditingReward(reward);
  };

  const q = newReward.tripId.trim().toLowerCase();
  const filteredTrips = q
    ? trips?.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 6) || []
    : [];

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
          <Text style={[commonStyles.h3]}>Zarządzanie nagrodami</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#273a3a" }}>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[commonStyles.button, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={commonStyles.buttonText}>Dodaj nagrodę</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {isLoading ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color="#00ced1" />
              <Text style={[commonStyles.bodyText, { marginTop: 16 }]}>Ładowanie...</Text>
            </View>
          ) : rewards && rewards.length > 0 ? (
            <View style={{ gap: 16 }}>
              {rewards.map((reward) => (
                <View
                  key={reward.id}
                  style={{
                    backgroundColor: "#0f2323",
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[commonStyles.h4, { marginBottom: 4 }]}>
                        {reward.name}
                      </Text>
                      <Text style={[commonStyles.bodyText, { color: "#9ca3af", marginBottom: 8 }]}>
                        {reward.description}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="coin" size={16} color="#fbbf24" />
                          <Text style={[commonStyles.smallText, { color: "#fbbf24" }]}>
                            {reward.coinCost} monet
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="cube" size={16} color="#10b981" />
                          <Text style={[commonStyles.smallText, { color: "#10b981" }]}>
                            {reward.availableQuantity} szt.
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => openEditModal(reward)}
                        style={{
                          backgroundColor: "#1f2937",
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons name="create" size={16} color="#00ced1" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(reward.id)}
                        style={{
                          backgroundColor: "#1f2937",
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[commonStyles.smallText, { color: "#6b7280" }]}>
                      Utworzona: {new Date(reward.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[commonStyles.smallText, { color: "#6b7280" }]}>
                      {reward.createdBy?.firstName} {reward.createdBy?.lastName}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="gift" size={48} color="#6b7280" />
              <Text style={[commonStyles.bodyText, { marginTop: 16, textAlign: "center" }]}>
                Brak nagród
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
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
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
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
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                Wycieczka
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
                placeholder="ID wycieczki lub wyszukaj"
                placeholderTextColor="#6b7280"
                value={newReward.tripId}
                onChangeText={(text) => setNewReward({ ...newReward, tripId: text })}
              />
              {filteredTrips.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#0f2323",
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    marginTop: 8,
                    borderRadius: 8,
                    maxHeight: 160,
                  }}
                >
                  <ScrollView nestedScrollEnabled style={{ padding: 8 }}>
                    {filteredTrips.map((trip) => (
                      <TouchableOpacity
                        key={trip.id}
                        onPress={() => setNewReward({ ...newReward, tripId: trip.id })}
                        style={{ paddingVertical: 8 }}
                      >
                        <Text style={{ color: "#fff" }}>
                          {trip.name}{" "}
                          <Text style={{ color: "#9ca3af" }}>({trip.id})</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
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

      {/* Edit Modal */}
      <Modal
        visible={!!editingReward}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingReward(null)}
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
            <Text style={[commonStyles.h3]}>Edytuj nagrodę</Text>
            <TouchableOpacity onPress={() => setEditingReward(null)}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 24 }}>
            {editingReward && (
              <>
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
                    value={editingReward.name}
                    onChangeText={(text) => setEditingReward({ ...editingReward, name: text })}
                  />
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
                    value={editingReward.description}
                    onChangeText={(text) => setEditingReward({ ...editingReward, description: text })}
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
                      value={editingReward.availableQuantity.toString()}
                      onChangeText={(text) => setEditingReward({ ...editingReward, availableQuantity: parseInt(text) || 0 })}
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
                      value={editingReward.coinCost.toString()}
                      onChangeText={(text) => setEditingReward({ ...editingReward, coinCost: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                    Obrazek nagrody (opcjonalnie)
                  </Text>
                  
                  {editingReward.image ? (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: editingReward.image }}
                        style={{
                          width: "100%",
                          height: 120,
                          borderRadius: 12,
                          backgroundColor: "#0f2323",
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => setEditingReward({ ...editingReward, image: "" })}
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
                  onPress={handleUpdate}
                  disabled={updateReward.isPending}
                  style={[commonStyles.button, { marginBottom: 24 }]}
                >
                  <Text style={commonStyles.buttonText}>
                    {updateReward.isPending ? "Aktualizowanie..." : "Zapisz zmiany"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
