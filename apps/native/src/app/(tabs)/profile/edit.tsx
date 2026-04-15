import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, TextInput } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetCurrentUserDocument,
  UpdateUserDocument,
} from "@mirai-app/graphql-client";
import { PhotoCaptureModal } from "~/components/camera/PhotoCaptureModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFileDownload, useFileUpload } from "~/hooks/files";
import { YStack, XStack, Text } from "@mirai-app/ui";

const sanitizeNameInput = (value: string) => value.replace(/\d+/g, "");

interface UploadAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// Color values for React Native styles
const colors = {
  backgroundDark: "#17181c",
  white: "#ffffff",
  primary: "#00ced1",
  cardDark: "#1b2828",
  textMuted: "#475569",
  borderZinc700: "rgba(48, 54, 61, 1)",
  backgroundDarkAlt: "rgba(39, 41, 53, 0.65)",
};

// Border radius values
const borderRadius = {
  xl: 20,
  lg: 16,
  md: 12,
  full: 9999,
};

// Spacing values
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Typography values
const typography = {
  base: 16,
  sm: 14,
  xs: 12,
  bold: "700" as const,
  medium: "500" as const,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const urqlClient = useClient();

  // GraphQL query for current user
  const [{ data: userData }] = useQuery({
    query: GetCurrentUserDocument,
  });
  const currentUser = userData?.me;

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
  }, [currentUser]);

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

  // GraphQL mutation for updating profile
  const [, updateProfileMutation] = useMutation(UpdateUserDocument);

  // Cache reexecution helper - urql doesn't have invalidate, use reexecuteOperation
  const refreshUserCache = useCallback(async () => {
    // Reexecute the query with network-only policy to refresh cache
    await urqlClient.reexecuteOperation({
      key: JSON.stringify(["GetCurrentUser", {}]),
      query: GetCurrentUserDocument,
      variables: {},
      kind: "query",
      context: {
        requestPolicy: "network-only",
      },
    } as unknown as import("@urql/core").Operation);
  }, [urqlClient]);

  const isUploading = uploadStatus === "uploading";
  const isDownloading = avatarStatus === "loading";
  const isBusy = isUploading || isDownloading || isPicking || isCameraOpen;

  // Track saving state locally since urql doesn't expose isPending directly
  const [isSaving, setIsSaving] = useState(false);
  const remoteAvatarUri = avatarFile?.uri
    ? `${avatarFile.uri}?v=${encodeURIComponent(currentUser?.updatedAt?.toString() ?? "")}`
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

      // Update user profile with hasAvatar flag
      const result = await updateProfileMutation({
        input: {
          id: currentUser.id,
          hasAvatar: true,
        },
      });

      if (result.error) {
        Alert.alert("Upload Failed", result.error.message);
        return;
      }

      await refreshUserCache();
      await refreshAvatar(true);
    },
    [
      avatarStoragePath,
      currentUser?.id,
      refreshUserCache,
      refreshAvatar,
      resetUpload,
      updateProfileMutation,
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

    if (!currentUser?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      const result = await updateProfileMutation({
        input: {
          id: currentUser.id,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
        },
      });

      if (result.error) {
        Alert.alert("Save Failed", result.error.message);
        return;
      }

      await refreshUserCache();
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
      Alert.alert("Save Failed", message);
    }
  }, [
    firstName,
    lastName,
    router,
    updateProfileMutation,
    currentUser?.id,
    refreshUserCache,
  ]);

  return (
    <YStack flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
          gap: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={spacing.sm}>
          <Text
            fontSize={10}
            fontWeight="bold"
            color="$textMuted"
            textTransform="uppercase"
            letterSpacing={1.5}
            marginLeft={spacing.xs}
          >
            Profile Photo
          </Text>
          <YStack
            onPress={handleChangePhoto}
            style={{
              borderRadius: borderRadius.xl,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.borderZinc700,
              backgroundColor: colors.cardDark,
            }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: "100%",
                  height: 180,
                }}
                contentFit="cover"
                cachePolicy="none"
              />
            ) : (
              <YStack
                height={160}
                alignItems="center"
                justifyContent="center"
                gap={spacing.sm}
                style={{ backgroundColor: colors.backgroundDarkAlt }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={32}
                  color={colors.primary}
                />
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: typography.sm,
                    fontWeight: typography.medium,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  No photo selected
                </Text>
              </YStack>
            )}

            <XStack
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingVertical: spacing.md,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.08)",
              }}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 12,
                      fontWeight: typography.bold,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
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
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 12,
                      fontWeight: typography.bold,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    {avatarUri ? "Change Photo" : "Add Photo"}
                  </Text>
                </>
              )}
            </XStack>
          </YStack>
        </YStack>

        <YStack gap={spacing.sm}>
          <Text
            fontSize={10}
            fontWeight="bold"
            color="$textMuted"
            textTransform="uppercase"
            letterSpacing={1.5}
            marginLeft={spacing.xs}
          >
            First Name
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
              fontWeight: typography.medium,
            }}
            value={firstName}
            onChangeText={(value) => setFirstName(sanitizeNameInput(value))}
            placeholder="Enter first name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            editable={!isSaving}
          />
        </YStack>

        <YStack gap={spacing.sm}>
          <Text
            fontSize={10}
            fontWeight="bold"
            color="$textMuted"
            textTransform="uppercase"
            letterSpacing={1.5}
            marginLeft={spacing.xs}
          >
            Last Name
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
              fontWeight: typography.medium,
            }}
            value={lastName}
            onChangeText={(value) => setLastName(sanitizeNameInput(value))}
            placeholder="Enter last name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            editable={!isSaving}
          />
        </YStack>

        <YStack
          onPress={() => {
            setIsSaving(true);
            void handleSave().finally(() => setIsSaving(false));
          }}
          style={{
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.lg,
            minHeight: 52,
            marginTop: spacing.sm,
            opacity: isSaving || isUploading ? 0.7 : 1,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text
              style={{
                color: colors.backgroundDark,
                fontSize: typography.base,
                fontWeight: typography.bold,
                textTransform: "uppercase",
                letterSpacing: 0.7,
              }}
            >
              Save Changes
            </Text>
          )}
        </YStack>
      </ScrollView>
      <PhotoCaptureModal
        visible={isCameraOpen}
        title="Take Profile Photo"
        facing="front"
        isUsingPhoto={isPicking}
        onClose={() => setIsCameraOpen(false)}
        onUsePhoto={handleUseCapturedPhoto}
      />
    </YStack>
  );
}
