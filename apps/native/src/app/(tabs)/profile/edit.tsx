import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { PhotoCaptureModal } from "~/components/camera/PhotoCaptureModal";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useFileDownload, useFileUpload } from "~/hooks/files";
import { borderRadius, colors, spacing, typography } from "~/styles";

const sanitizeNameInput = (value: string) => value.replace(/\d+/g, "");
interface UploadAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useAppSafeAreaInsets();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const userMyQueryOptions = trpc.user.getMy.queryOptions();
  const { data: currentUser } = useQuery(userMyQueryOptions);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [localAvatarPreviewUri, setLocalAvatarPreviewUri] = useState<
    string | null
  >(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
    reset: resetUpload,
  } = useFileUpload();
  const {
    download: downloadAvatar,
    status: avatarStatus,
    file: avatarFile,
    reset: resetAvatar,
    abort: abortAvatar,
  } = useFileDownload();

  const avatarStoragePath = useMemo(() => {
    if (!currentUser?.id) return null;
    return `avatar/${currentUser.id}.jpg`;
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.firstName ?? "");
    setLastName(currentUser.lastName ?? "");
  }, [currentUser?.firstName, currentUser?.lastName, currentUser?.id]);

  const refreshAvatar = useCallback(
    async (skipCache = false) => {
      if (!avatarStoragePath) return;
      resetAvatar();
      await downloadAvatar({ storagePath: avatarStoragePath, skipCache }).catch(
        () => undefined,
      );
    },
    [avatarStoragePath, downloadAvatar, resetAvatar],
  );

  useEffect(() => {
    if (!currentUser?.hasAvatar || !avatarStoragePath) {
      resetAvatar();
      return;
    }

    void refreshAvatar(true);
    return () => {
      abortAvatar();
    };
  }, [
    abortAvatar,
    avatarStoragePath,
    currentUser?.hasAvatar,
    currentUser?.updatedAt,
    refreshAvatar,
    resetAvatar,
  ]);

  const updateAvatarMutation = useMutation(
    trpc.user.updateAvatar.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userMyQueryOptions.queryKey,
        });
      },
    }),
  );

  const updateProfileMutation = useMutation(
    trpc.user.updateMyProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: userMyQueryOptions.queryKey,
        });
      },
    }),
  );

  const isUploading = uploadStatus === "uploading";
  const isDownloading = avatarStatus === "loading";
  const isBusy = isUploading || isDownloading || isPicking || isCameraOpen;
  const remoteAvatarUri = avatarFile?.uri
    ? `${avatarFile.uri}?v=${encodeURIComponent(currentUser?.updatedAt ?? "")}`
    : null;
  const avatarUri = localAvatarPreviewUri ?? remoteAvatarUri;

  const uploadAvatarAsset = useCallback(
    async (asset: UploadAsset) => {
      if (!currentUser?.id || !avatarStoragePath) return;

      resetUpload();
      setLocalAvatarPreviewUri(asset.uri);
      await upload({
        storagePath: avatarStoragePath,
        fileUri: asset.uri,
        fileName: asset.fileName ?? `avatar-${currentUser.id}.jpg`,
        contentType: asset.mimeType ?? "image/jpeg",
        upsert: true,
      });

      await updateAvatarMutation.mutateAsync({ hasAvatar: true });
      await refreshAvatar(true);
    },
    [
      avatarStoragePath,
      currentUser?.id,
      refreshAvatar,
      resetUpload,
      updateAvatarMutation,
      upload,
    ],
  );

  const pickAvatarFromLibrary = useCallback(async () => {
    if (!currentUser?.id || !avatarStoragePath) return;

    try {
      setIsPicking(true);
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      const message =
        error instanceof Error ? error.message : "Failed to update avatar";
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
        Alert.alert(
          "Permission Required",
          "Camera access is required to take a profile photo.",
        );
        return;
      }
    }

    setIsCameraOpen(true);
  }, [
    avatarStoragePath,
    cameraPermission,
    currentUser?.id,
    requestCameraPermission,
  ]);

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
        const message =
          error instanceof Error ? error.message : "Failed to update avatar";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsPicking(false);
      }
    },
    [currentUser?.id, uploadAvatarAsset],
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
      Alert.alert(
        "Validation Error",
        "First name and last name must have at least 2 characters.",
      );
      return;
    }
    if (/\d/.test(trimmedFirstName) || /\d/.test(trimmedLastName)) {
      Alert.alert(
        "Validation Error",
        "First name and last name cannot contain digits.",
      );
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
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
            paddingBottom: insets.bottom + spacing.xxxl,
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
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="none"
              />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons
                  name="person-circle-outline"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.placeholderText}>No photo selected</Text>
              </View>
            )}

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
                  <Ionicons
                    name="camera-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.badgeText}>
                    {avatarUri ? "Change Photo" : "Add Photo"}
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
            (updateProfileMutation.isPending || isUploading) &&
              styles.saveButtonDisabled,
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
