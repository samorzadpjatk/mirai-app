import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "~/styles";
import {
  useDeleteReward,
  useReward,
  useSetRewardHidden,
  useUpdateRewardPurchaseStatus,
  useUpdateReward,
} from "~/hooks/rewards";
import * as ImagePicker from "expo-image-picker";
import { useFileUpload } from "~/hooks/files";
import {
  AppModalShell,
  AppModalFooter,
  FormField,
  ThemedTextInput,
} from "~/components/common/ui";

interface Props {
  rewardId: string | null;
  onClose: () => void;
}

type PurchaseStatus = "BOUGHT" | "ACCEPTED" | "IN_DELIVERY" | "CANCELLED" | "DELIVERED";

const purchaseStatusMeta: Record<
  PurchaseStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  BOUGHT: { label: "Bought", color: "#fbbf24", icon: "receipt-outline" },
  ACCEPTED: { label: "Accepted", color: "#22c55e", icon: "checkmark-circle-outline" },
  IN_DELIVERY: { label: "In delivery", color: "#38bdf8", icon: "car-outline" },
  CANCELLED: { label: "Cancelled", color: "#ef4444", icon: "close-circle-outline" },
  DELIVERED: { label: "Delivered", color: "#10b981", icon: "cube-outline" },
};

export default function AdminRewardDetailModal({ rewardId, onClose }: Props) {
  const { upload, status: uploadStatus } = useFileUpload();
  const { data: reward, isLoading } = useReward(rewardId ?? null);
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const setRewardHidden = useSetRewardHidden();
  const updatePurchaseStatus = useUpdateRewardPurchaseStatus();

  const [form, setForm] = useState({
    name: "",
    description: "",
    availableQuantity: "",
    coinCost: "", // Now represents percentage
    images: [] as string[],
  });
  const [collectionMethodByPurchase, setCollectionMethodByPurchase] = useState<Record<string, string>>({});
  const [hydratedRewardId, setHydratedRewardId] = useState<string | null>(null);

  if (reward && hydratedRewardId !== reward.id) {
    setForm({
      name: reward.name,
      description: reward.description,
      availableQuantity: String(reward.availableQuantity),
      coinCost: String(reward.originalCoinCost ?? reward.coinCost), // Show original percentage
      images:
        reward.images && reward.images.length > 0
          ? reward.images
          : reward.image
            ? [reward.image]
            : [],
    });
    const initialCollectionMethods = reward.purchases.reduce<Record<string, string>>(
      (acc, purchase) => {
        acc[purchase.id] = purchase.collectionMethod ?? "";
        return acc;
      },
      {},
    );
    setCollectionMethodByPurchase(initialCollectionMethods);
    setHydratedRewardId(reward.id);
  }

  const purchasedCount = useMemo(() => reward?.purchases?.length ?? 0, [reward]);

  const handleSave = async () => {
    if (!rewardId) return;
    if (!form.name || !form.description || !form.availableQuantity || !form.coinCost) {
      Alert.alert("Error", "Fill in all required fields");
      return;
    }

    const coinCostPercentage = parseInt(form.coinCost, 10);
    if (isNaN(coinCostPercentage) || coinCostPercentage < 1 || coinCostPercentage > 100) {
      Alert.alert("Error", "Cost must be between 1% and 100%");
      return;
    }

    try {
      await updateReward.mutateAsync({
        id: rewardId,
        name: form.name,
        description: form.description,
        availableQuantity: parseInt(form.availableQuantity, 10),
        coinCost: coinCostPercentage, // Store as percentage
        images: form.images,
      });
      Alert.alert("Saved", "Reward has been updated");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      Alert.alert("Error", message);
    }
  };

  const handleDelete = () => {
    if (!rewardId) return;

    Alert.alert(
      "Delete reward",
      "Are you sure you want to delete this reward?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteReward.mutateAsync({ id: rewardId });
                Alert.alert("Deleted", "Reward has been deleted");
                onClose();
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Failed to delete reward";
                Alert.alert("Error", message);
              }
            })();
          },
        },
      ],
    );
  };

  const isMutating =
    updateReward.isPending ||
    deleteReward.isPending ||
    updatePurchaseStatus.isPending ||
    setRewardHidden.isPending;
  const isUploadingImage = uploadStatus === "uploading";
  const previewImage =
    reward?.signedImageUrls?.[0] ??
    reward?.signedImageUrl ??
    reward?.images?.[0] ??
    reward?.image ??
    form.images[0] ??
    null;

  const handleToggleHidden = async () => {
    if (!reward) return;

    try {
      await setRewardHidden.mutateAsync({
        id: reward.id,
        isHidden: !reward.isHidden,
      });
      Alert.alert("Saved", reward.isHidden ? "Reward is now visible." : "Reward has been hidden.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update visibility";
      Alert.alert("Error", message);
    }
  };

  const handlePurchaseStatusChange = async (
    purchaseId: string,
    nextStatus: PurchaseStatus,
  ) => {
    const collectionMethod = collectionMethodByPurchase[purchaseId]?.trim();

    if (nextStatus === "ACCEPTED" && !collectionMethod) {
      Alert.alert("Collection method required", "Provide pickup instructions before accepting.");
      return;
    }

    if (nextStatus === "IN_DELIVERY") {
      const purchase = reward?.purchases.find((item) => item.id === purchaseId);
      const savedCollectionMethod = purchase?.collectionMethod?.trim();
      if (!collectionMethod && !savedCollectionMethod) {
        Alert.alert("Collection method required", "Provide pickup instructions first.");
        return;
      }
    }

    try {
      await updatePurchaseStatus.mutateAsync({
        purchaseId,
        status: nextStatus,
        ...(collectionMethod ? { collectionMethod } : {}),
      });
      Alert.alert("Saved", `Purchase moved to ${purchaseStatusMeta[nextStatus].label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update purchase status";
      Alert.alert("Error", message);
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

        setForm((prev) => ({
          ...prev,
          images:
            prev.images.length > 0
              ? [storagePath, ...prev.images.slice(1)]
              : [storagePath],
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Error", message);
    }
  };

  const handleRemoveImage = async () => {
    if (!rewardId) return;
    try {
      await updateReward.mutateAsync({ id: rewardId, images: [] });
      setForm((prev) => ({ ...prev, images: [] }));
      Alert.alert("Deleted", "Reward image has been removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove image";
      Alert.alert("Error", message);
    }
  };

  if (!rewardId) return null;

  return (
    <AppModalShell
      visible={!!rewardId}
      title="Reward Details"
      onClose={onClose}
      variant="pageSheet"
    >
      <View style={{ padding: spacing.lg }}>
        {reward && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>
              Created: {new Date(reward.createdAt).toLocaleDateString()} | {reward.createdBy?.firstName} {reward.createdBy?.lastName}
            </Text>
            {reward?.isHidden ? (
              <Text style={{ color: colors.danger, fontSize: typography.sm, marginTop: spacing.xs }}>
                Hidden from users
              </Text>
            ) : null}
          </View>
        )}

        {isLoading || !reward ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView style={{ padding: 0 }}>
            {previewImage && (
              <View style={{ marginBottom: spacing.lg }}>
                <Image
                  testID="reward-image"
                  source={{ uri: previewImage }}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: borderRadius.md, backgroundColor: colors.cardDark }}
                  resizeMode="cover"
                />
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={isUploadingImage}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      alignItems: "center",
                    }}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={{ color: colors.white, fontWeight: typography.semibold }}>Change image</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveImage}
                    disabled={isMutating}
                    style={{
                      backgroundColor: colors.danger,
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: typography.semibold }}>Remove image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!previewImage && (
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingImage}
                style={{
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.lg,
                }}
              >
                {isUploadingImage ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="image" size={24} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>Add image</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <FormField label="Name" required>
              <ThemedTextInput
                placeholder="Reward name"
                value={form.name}
                onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              />
            </FormField>

            <FormField label="Description" required>
              <ThemedTextInput
                placeholder="Reward description"
                multiline
                value={form.description}
                onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
              />
            </FormField>

            <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
              <FormField label="Available quantity" required style={{ flex: 1 }}>
                <ThemedTextInput
                  keyboardType="numeric"
                  value={form.availableQuantity}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, availableQuantity: text }))}
                />
              </FormField>
              <FormField label="Cost (% of total points)" required style={{ flex: 1 }}>
                <ThemedTextInput
                  keyboardType="numeric"
                  value={form.coinCost}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, coinCost: text }))}
                />
                <Text style={{ fontSize: typography.xs, marginTop: spacing.xs, color: colors.textSecondary }}>
                  Percentage of total available points
                </Text>
              </FormField>
            </View>

            <View style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
              <Text style={{ fontWeight: typography.semibold, color: colors.white, marginBottom: spacing.sm }}>Purchases</Text>
              <Text style={{ color: colors.textSecondary }}>
                {purchasedCount} purchased
              </Text>
              {reward.purchases.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  {reward.purchases.map((purchase) => {
                    const status = (purchase.status ?? "BOUGHT");
                    const statusInfo = purchaseStatusMeta[status] ?? purchaseStatusMeta.BOUGHT;
                    const purchaserName =
                      `${purchase.purchasedBy?.firstName ?? ""} ${purchase.purchasedBy?.lastName ?? ""}`.trim();
                    const canEditCollectionMethod =
                      status === "BOUGHT" || status === "ACCEPTED";

                    return (
                      <View
                        key={purchase.id}
                        style={{
                          backgroundColor: "#0f2323",
                          borderWidth: 1,
                          borderColor: "#273a3a",
                          borderRadius: 12,
                          padding: 12,
                          gap: 10,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ color: colors.white, fontWeight: typography.medium }}>
                            {purchase.quantity} pcs. • {purchase.totalCost} coins
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: spacing.xs,
                              borderWidth: 1,
                              borderColor: statusInfo.color,
                              borderRadius: 999,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs,
                              backgroundColor: `${statusInfo.color}20`,
                            }}
                          >
                            <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
                            <Text style={{ color: statusInfo.color, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>
                              {statusInfo.label}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ color: colors.textSecondary }}>
                          Group: {purchase.group?.name ?? "Unknown"}
                        </Text>
                        {purchaserName ? (
                          <Text style={{ color: colors.textSecondary }}>
                            Claimed by: {purchaserName}
                          </Text>
                        ) : null}
                        <Text style={{ color: colors.textSecondary }}>
                          {new Date(purchase.purchasedAt).toLocaleString()}
                        </Text>

                        <ThemedTextInput
                          placeholder="Collection method (e.g. pick up at HQ desk)"
                          value={collectionMethodByPurchase[purchase.id] ?? ""}
                          editable={canEditCollectionMethod}
                          onChangeText={(text: string) =>
                            setCollectionMethodByPurchase((prev) => ({
                              ...prev,
                              [purchase.id]: text,
                            }))
                          }
                        />

                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                          {status === "BOUGHT" ? (
                            <>
                              <TouchableOpacity
                                onPress={() => handlePurchaseStatusChange(purchase.id, "ACCEPTED")}
                                disabled={isMutating}
                                style={{
                                  backgroundColor: colors.success,
                                  borderRadius: 999,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                }}
                              >
                                <Text style={{ color: colors.backgroundDark, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handlePurchaseStatusChange(purchase.id, "CANCELLED")}
                                disabled={isMutating}
                                style={{
                                  backgroundColor: colors.danger,
                                  borderRadius: 999,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                }}
                              >
                                <Text style={{ color: colors.backgroundDark, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>Cancel + refund</Text>
                              </TouchableOpacity>
                            </>
                          ) : null}

                          {status === "ACCEPTED" ? (
                            <>
                              <TouchableOpacity
                                onPress={() => handlePurchaseStatusChange(purchase.id, "IN_DELIVERY")}
                                disabled={isMutating}
                                style={{
                                  backgroundColor: colors.primary,
                                  borderRadius: 999,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                }}
                              >
                                <Text style={{ color: colors.backgroundDark, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>Set in delivery</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handlePurchaseStatusChange(purchase.id, "CANCELLED")}
                                disabled={isMutating}
                                style={{
                                  backgroundColor: colors.danger,
                                  borderRadius: 999,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                }}
                              >
                                <Text style={{ color: colors.backgroundDark, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>Cancel + refund</Text>
                              </TouchableOpacity>
                            </>
                          ) : null}

                          {status === "IN_DELIVERY" ? (
                            <>
                              <TouchableOpacity
                                onPress={() => handlePurchaseStatusChange(purchase.id, "DELIVERED")}
                                disabled={isMutating}
                                style={{
                                  backgroundColor: colors.success,
                                  borderRadius: 999,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                }}
                              >
                                <Text style={{ color: colors.backgroundDark, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>Mark delivered</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handlePurchaseStatusChange(purchase.id, "CANCELLED")}
                                disabled={isMutating}
                                style={{
                                  backgroundColor: colors.danger,
                                  borderRadius: 999,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                }}
                              >
                                <Text style={{ color: colors.backgroundDark, letterSpacing: 0.6, fontSize: typography.xs, fontWeight: typography.semibold }}>Cancel + refund</Text>
                              </TouchableOpacity>
                            </>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleToggleHidden}
              disabled={isMutating}
              style={{
                backgroundColor: reward.isHidden ? colors.primaryOpacity10 : colors.red900Opacity30,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.sm,
              }}
            >
              {setRewardHidden.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={{ color: colors.white, fontWeight: typography.semibold }}>
                  {reward.isHidden ? "Unhide reward" : "Hide reward"}
                </Text>
              )}
            </TouchableOpacity>

          </ScrollView>
          <AppModalFooter
            primaryLabel={updateReward.isPending ? "Saving..." : "Save changes"}
            onPrimary={handleSave}
            isPrimaryLoading={updateReward.isPending}
            isPrimaryDisabled={isMutating}
            secondaryLabel="Delete"
            onSecondary={handleDelete}
          />
          </View>
        )}
      </View>
    </AppModalShell>
  );
}
