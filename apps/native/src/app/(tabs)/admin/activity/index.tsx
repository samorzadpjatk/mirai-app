import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useFileUpload } from "~/hooks/files";

type ActivityType =
  | "submission"
  | "challenge_event"
  | "rank_change"
  | "custom"
  | "user_post";

type AdminActivity = {
  id: string;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: Date | string;
  admin?: { firstName?: string | null; lastName?: string | null } | null;
  submissionActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  rankChangeActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  userPost?: {
    author?: {
      group?: { name?: string | null } | null;
    } | null;
  } | null;
};

const activityTypeFilters: Array<{ label: string; value: "all" | ActivityType }> = [
  { label: "All", value: "all" },
  { label: "Submission", value: "submission" },
  { label: "Challenge", value: "challenge_event" },
  { label: "Rank", value: "rank_change" },
  { label: "Custom", value: "custom" },
  { label: "User Post", value: "user_post" },
];

const formatRelativeTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getActivityGroupName = (activity: AdminActivity) =>
  activity.submissionActivity?.group?.name?.trim() ||
  activity.rankChangeActivity?.group?.name?.trim() ||
  activity.userPost?.author?.group?.name?.trim() ||
  "";

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
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
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

export default function AdminActivityScreen() {
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();
  const queryClient = useQueryClient();
  const { upload, reset: resetUpload, status: uploadStatus, progress: uploadProgress } =
    useFileUpload();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<AdminActivity | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [newImagePath, setNewImagePath] = useState("");
  const [newImagePreviewUri, setNewImagePreviewUri] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const feedQueryOptions = trpc.activityFeed.getByTripModeration.queryOptions({
    tripId,
    page: 1,
    pageSize: 100,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());
  const { data, isLoading, isRefetching, refetch } = useQuery({
    ...feedQueryOptions,
    enabled: Boolean(tripId),
  });

  const invalidateFeed = async () => {
    await queryClient.invalidateQueries({ queryKey: feedQueryOptions.queryKey });
  };

  const createCustomMutation = useMutation(
    trpc.activityFeed.createCustom.mutationOptions({
      onSuccess: async () => {
        await invalidateFeed();
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewPinned(false);
        setNewImagePath("");
        setNewImagePreviewUri(null);
        resetUpload();
      },
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const updateMutation = useMutation(
    trpc.activityFeed.update.mutationOptions({
      onSuccess: async () => {
        await invalidateFeed();
        setIsEditModalOpen(false);
        setEditingActivity(null);
      },
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const pinMutation = useMutation(
    trpc.activityFeed.setPinned.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const hideMutation = useMutation(
    trpc.activityFeed.hide.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const unhideMutation = useMutation(
    trpc.activityFeed.unhide.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.activityFeed.delete.mutationOptions({
      onSuccess: invalidateFeed,
      onError: (error) => Alert.alert("Error", error.message),
    }),
  );

  const allActivities = (data?.activities ?? []) as AdminActivity[];

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allActivities.filter((activity) => {
      if (selectedType !== "all" && activity.activityType !== selectedType) {
        return false;
      }

      if (!query) return true;

      const groupName = getActivityGroupName(activity).toLowerCase();
      return (
        activity.title.toLowerCase().includes(query) || groupName.includes(query)
      );
    });
  }, [allActivities, searchTerm, selectedType]);

  const isBusy =
    createCustomMutation.isPending ||
    updateMutation.isPending ||
    pinMutation.isPending ||
    hideMutation.isPending ||
    unhideMutation.isPending ||
    deleteMutation.isPending;
  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent =
    uploadProgress.percent != null ? Math.round(uploadProgress.percent * 100) : null;

  const canDelete = currentUser?.role === "ADMIN";

  const handlePickImageForCustom = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const extension = getImageExtension(asset);
      const fileName = asset.fileName?.trim() ?? `custom-activity-${Date.now()}.${extension}`;
      const storagePath = `activity/${tripId}/custom-${Date.now()}.${extension}`;
      const contentType = asset.mimeType ?? getImageContentType(extension);

      await upload({
        storagePath,
        fileUri: asset.uri,
        fileName,
        contentType,
        upsert: true,
      });

      setNewImagePath(storagePath);
      setNewImagePreviewUri(asset.uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  if (!tripId) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Trip ID is required</Text>
          <Text style={styles.centerSubtitle}>
            Open this view from Admin Panel with selected trip.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="Activity"
        subtitle="Manage community activity feed"
      />

      <View style={styles.filtersWrap}>
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Filter by title or group..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
        />

        <FlatList
          horizontal
          data={activityTypeFilters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFilters}
          renderItem={({ item }) => {
            const active = selectedType === item.value;
            return (
              <TouchableOpacity
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setSelectedType(item.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerSubtitle}>Loading activities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="chatbubble-ellipses-outline" size={38} color={colors.textSecondary} />
              <Text style={styles.centerTitle}>No activities found</Text>
              <Text style={styles.centerSubtitle}>
                Change filters or create custom activity.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const groupName = getActivityGroupName(item);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardType}>{item.activityType}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {groupName ? <Text style={styles.cardMeta}>Group: {groupName}</Text> : null}
                    <Text style={styles.cardMeta}>{formatRelativeTime(item.createdAt)}</Text>
                  </View>
                  <View style={styles.badges}>
                    {item.isPinned ? (
                      <View style={styles.badgePinned}>
                        <Ionicons name="pin" size={12} color={colors.primary} />
                        <Text style={styles.badgePinnedText}>Pinned</Text>
                      </View>
                    ) : null}
                    {item.isHidden ? (
                      <View style={styles.badgeHidden}>
                        <Ionicons name="eye-off" size={12} color={colors.warning} />
                        <Text style={styles.badgeHiddenText}>Hidden</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}

                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImagePreview} />
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setEditingActivity(item);
                      setEditTitle(item.title);
                      setEditDescription(item.description ?? "");
                      setIsEditModalOpen(true);
                    }}
                    disabled={isBusy}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.white} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      pinMutation.mutate({
                        activityId: item.id,
                        isPinned: !item.isPinned,
                      })
                    }
                    disabled={isBusy}
                  >
                    <Ionicons
                      name={item.isPinned ? "pin" : "pin-outline"}
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.actionText}>{item.isPinned ? "Unpin" : "Pin"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      item.isHidden
                        ? unhideMutation.mutate({ activityId: item.id })
                        : hideMutation.mutate({ activityId: item.id })
                    }
                    disabled={isBusy}
                  >
                    <Ionicons
                      name={item.isHidden ? "eye" : "eye-off"}
                      size={16}
                      color={colors.warning}
                    />
                    <Text style={styles.actionText}>
                      {item.isHidden ? "Unhide" : "Hide"}
                    </Text>
                  </TouchableOpacity>

                  {canDelete ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert("Delete activity", "Are you sure?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteMutation.mutate({ activityId: item.id }),
                          },
                        ]);
                      }}
                      disabled={isBusy}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
      <AdminAddFab
        onPress={() => setIsCreateModalOpen(true)}
        accessibilityLabel="Add activity"
      />

      <Modal
        visible={isEditModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit activity</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
            />
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              style={[styles.modalInput, styles.modalTextarea]}
              multiline
            />
            <Text style={styles.readOnlyHint}>
              Image is read-only and inherited from source activity.
            </Text>

            <TouchableOpacity
              style={styles.submitButton}
              disabled={updateMutation.isPending}
              onPress={() => {
                if (!editingActivity) return;

                const title = editTitle.trim();
                if (!title) {
                  Alert.alert("Validation", "Title is required");
                  return;
                }

                const description = editDescription.trim();

                const payload: {
                  activityId: string;
                  title?: string;
                  description?: string | null;
                } = { activityId: editingActivity.id };

                if (title !== editingActivity.title) {
                  payload.title = title;
                }

                if (description !== (editingActivity.description ?? "")) {
                  payload.description = description.length > 0 ? description : null;
                }

                if (Object.keys(payload).length === 1) {
                  setIsEditModalOpen(false);
                  setEditingActivity(null);
                  return;
                }

                updateMutation.mutate(payload);
              }}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Save changes</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isCreateModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create custom activity</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Title"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
            />
            <TextInput
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              style={[styles.modalInput, styles.modalTextarea]}
              multiline
            />

            <View style={styles.imageRow}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => {
                  void handlePickImageForCustom();
                }}
                activeOpacity={0.85}
                disabled={isUploadingImage}
              >
                <Ionicons name="image-outline" size={16} color={colors.primary} />
                <Text style={styles.imagePickerButtonText}>
                  {newImagePath ? "Change image" : "Add image"}
                </Text>
              </TouchableOpacity>

              {newImagePath ? (
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => {
                    setNewImagePath("");
                    setNewImagePreviewUri(null);
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
              <Text style={styles.readOnlyHint}>
                Uploading image{imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
              </Text>
            ) : null}

            {newImagePreviewUri ? (
              <Image source={{ uri: newImagePreviewUri }} style={styles.imagePreview} />
            ) : null}

            <Text style={styles.readOnlyHint}>Image is optional for custom activity.</Text>

            <Text style={styles.fieldLabel}>Publish mode</Text>
            <View style={styles.publishModeRow}>
              <TouchableOpacity
                style={[styles.typeChip, !newPinned && styles.typeChipActive]}
                onPress={() => setNewPinned(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, !newPinned && styles.typeChipTextActive]}>
                  Normal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeChip, newPinned && styles.typeChipActive]}
                onPress={() => setNewPinned(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, newPinned && styles.typeChipTextActive]}>
                  Pin to top
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.readOnlyHint}>
              Pin to top keeps this post above regular feed entries.
            </Text>

            <TouchableOpacity
              style={styles.submitButton}
              disabled={createCustomMutation.isPending || isUploadingImage}
              onPress={() => {
                const title = newTitle.trim();
                if (!title) {
                  Alert.alert("Validation", "Title is required");
                  return;
                }
                if (isUploadingImage) {
                  Alert.alert("Please wait", "Image upload is still in progress.");
                  return;
                }
                createCustomMutation.mutate({
                  tripId,
                  title,
                  description: newDescription.trim() || undefined,
                  imageUrl: newImagePath || undefined,
                  isPinned: newPinned,
                });
              }}
            >
              {createCustomMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  filtersWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.white,
  },
  typeFilters: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.backgroundDarkOpacity50,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity20,
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  typeChipTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    backgroundColor: colors.cardDark,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cardType: {
    color: colors.primary,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: "700",
  },
  cardMeta: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginTop: 2,
  },
  badges: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  badgePinned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryOpacity20,
  },
  badgePinnedText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeHidden: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  badgeHiddenText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: "700",
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  cardImagePreview: {
    width: "100%",
    height: 140,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  actionText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  centerTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: "700",
  },
  centerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: "700",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDarkOpacity80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.white,
  },
  modalTextarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  readOnlyHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
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
    height: 140,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  publishModeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: "700",
  },
});
