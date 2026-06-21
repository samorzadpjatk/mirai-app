"use no memo";

import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoCaptureModal } from "~/components/camera/PhotoCaptureModal";
import { CachedImage } from "~/components/common/CachedImage";
import { useFileUpload } from "~/hooks/files";
import { borderRadius, colors, spacing, typography } from "~/styles";

const sanitizeNameInput = (value: string) => value.replace(/\d+/g, "");
interface UploadAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const userMyQueryOptions = orpc.user.getMy.queryOptions({ input: {} });
  const { data: currentUser } = useQuery(userMyQueryOptions);

  // Initialize form state from user data - only on initial load
  const initialFirstName = useMemo(() => currentUser?.firstName ?? "", [currentUser?.firstName]);
  const initialLastName = useMemo(() => currentUser?.lastName ?? "", [currentUser?.lastName]);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [isPicking, setIsPicking] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [localAvatarPreviewUri, setLocalAvatarPreviewUri] = useState<string>("");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
    reset: resetUpload,
  } = useFileUpload();
  const avatarStoragePath = useMemo(() => {
    if (!currentUser?.id) return null;
    return `avatar/${currentUser.id}.jpg`;
  }, [currentUser?.id]);

  const updateAvatarMutation = useMutation(
    orpc.user.updateAvatar.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userMyQueryOptions.queryKey,
        });
      },
    }),
  );

  const updateProfileMutation = useMutation(
    orpc.user.updateMyProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userMyQueryOptions.queryKey,
        });
      },
    }),
  );

  const isUploading = uploadStatus === "uploading";
  const isBusy = isUploading || isPicking || isCameraOpen;

  const uploadAvatarAsset = useCallback(
    async (asset: UploadAsset) => {
      if (!currentUser?.id || !avatarStoragePath) return;

      resetUpload();
      setLocalAvatarPreviewUri(asset.uri);
      await upload({
        storagePath: avatarStoragePath,
        fileUri: asset.uri,
        fileName: asset.fileName ?? `avatar-${currentUser?.id}.jpg`,
        contentType: asset.mimeType ?? "image/jpeg",
        upsert: true,
      });

      await updateAvatarMutation.mutateAsync({ hasAvatar: true });
    },
    [avatarStoragePath, currentUser?.id, resetUpload, updateAvatarMutation, upload],
  );

  const pickAvatarFromLibrary = useCallback(async () => {
    if (!currentUser?.id || !avatarStoragePath) return;

    try {
      setIsPicking(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Photo library access is required to pick a profile photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;
      await uploadAvatarAsset(result.assets[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update avatar";
      Alert.alert("Upload Failed", message);
    } finally {
      setIsPicking(false);
    }
  }, [avatarStoragePath, currentUser?.id, uploadAvatarAsset]);

  const openCamera = useCallback(async () => {
    if (!currentUser?.id || !avatarStoragePath) return;
    if (!cameraPermission?.granted) {
      const granted = await requestCameraPermission();
      if (!granted.granted) {
        Alert.alert("Permission Required", "Camera access is required to take a profile photo.");
        return;
      }
    }

    setIsCameraOpen(true);
  }, [avatarStoragePath, cameraPermission, currentUser?.id, requestCameraPermission]);

  const handleUseCapturedPhoto = useCallback(
    async (photo: { uri: string; mimeType: "image/jpeg" | "image/png" }) => {
      if (!currentUser?.id) return;

      try {
        setIsPicking(true);
        await uploadAvatarAsset({
          uri: photo.uri,
          fileName: `avatar-${currentUser.id}.jpg`,
          mimeType: photo.mimeType,
        });
        setIsCameraOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update avatar";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsPicking(false);
      }
    },
    [currentUser, uploadAvatarAsset],
  );

  const handleChangePhoto = useCallback(() => {
    if (isBusy) return;
    Alert.alert("Update Photo", "Choose a source", [
      { text: "Cancel", style: "cancel" },
      { text: "Choose Photo", onPress: () => void pickAvatarFromLibrary() },
      { text: "Take Photo", onPress: () => void openCamera() },
    ]);
  }, [isBusy, openCamera, pickAvatarFromLibrary]);

  const handleSave = useCallback(async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert("Validation Error", "First name and last name are required.");
      return;
    }
    if (trimmedFirstName.length < 2 || trimmedLastName.length < 2) {
      Alert.alert("Validation Error", "First name and last name must have at least 2 characters.");
      return;
    }
    if (/\d/.test(trimmedFirstName) || /\d/.test(trimmedLastName)) {
      Alert.alert("Validation Error", "First name and last name cannot contain digits.");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      Alert.alert("Save Failed", message);
    }
  }, [firstName, lastName, router, updateProfileMutation]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: spacing.lg,
            paddingBottom: 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imagePickerContainer}>
          <Text style={styles.inputLabel}>Profile Photo</Text>
          <TouchableOpacity
            style={styles.imageCard}
            activeOpacity={0.85}
            onPress={handleChangePhoto}
            disabled={isBusy}
          >
            <CachedImage
              source={localAvatarPreviewUri ? { uri: localAvatarPreviewUri } : undefined}
              storagePath={
                !localAvatarPreviewUri && currentUser?.hasAvatar ? avatarStoragePath : null
              }
              cacheKey={currentUser?.updatedAt?.toISOString() ?? null}
              fallback={
                <View style={styles.placeholder}>
                  <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                  <Text style={styles.placeholderText}>No photo selected</Text>
                </View>
              }
              style={styles.image}
              contentFit="cover"
            />

            <View style={styles.badge}>
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.badgeText}>
                    {uploadProgress.percent != null
                      ? `Uploading ${Math.round(uploadProgress.percent * 100)}%`
                      : "Uploading..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="camera-outline" size={16} color={colors.white} />
                  <Text style={styles.badgeText}>
                    {localAvatarPreviewUri || currentUser?.hasAvatar ? "Change Photo" : "Add Photo"}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={(value) => setFirstName(sanitizeNameInput(value))}
            placeholder="Enter first name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            editable={!updateProfileMutation.isPending}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={(value) => setLastName(sanitizeNameInput(value))}
            placeholder="Enter last name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            editable={!updateProfileMutation.isPending}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (updateProfileMutation.isPending || isUploading) && styles.saveButtonDisabled,
          ]}
          onPress={() => void handleSave()}
          disabled={updateProfileMutation.isPending || isUploading}
          activeOpacity={0.85}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <PhotoCaptureModal
        visible={isCameraOpen}
        title="Take Profile Photo"
        facing="front"
        isUsingPhoto={isPicking}
        onClose={() => setIsCameraOpen(false)}
        onUsePhoto={handleUseCapturedPhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  imagePickerContainer: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: spacing.xs,
  },
  imageCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    backgroundColor: colors.cardDark,
  },
  image: {
    width: "100%",
    height: 180,
  },
  placeholder: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(39, 41, 53, 0.65)",
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    minHeight: 52,
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.backgroundDark,
    fontSize: typography.base,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});
