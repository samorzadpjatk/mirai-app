import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useFileUpload } from "~/hooks/files";

interface ChallengeCaptureOptions {
  tripId: string | undefined;
  challengeId: string | undefined;
}

export function useChallengeCapture({
  tripId,
  challengeId,
}: ChallengeCaptureOptions) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: currentUserLoading } = useQuery({
    ...trpc.user.getMyWithGroup.queryOptions({ tripId: tripId ?? "" }),
    enabled: !!tripId,
  });
  const userTrip = currentUser?.trips?.[0];

  const {
    upload,
    abort: abortUpload,
    reset: resetUpload,
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
  } = useFileUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const resolveExtension = useCallback((asset: ImagePicker.ImagePickerAsset) => {
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
  }, []);

  const submissionMutation = useMutation(
    trpc.challengeSubmission.create.mutationOptions({
      onSuccess: async () => {
        if (!tripId || !challengeId) return;
        const submissionQuery =
          trpc.challengeSubmission.getByChallenge.queryOptions({
            tripId,
            challengeId,
          });
        await queryClient.invalidateQueries({
          queryKey: submissionQuery.queryKey,
        });
      },
    }),
  );

  const deleteSubmissionMutation = useMutation(
    trpc.challengeSubmission.deleteMine.mutationOptions({
      onSuccess: async () => {
        if (!tripId || !challengeId) return;
        const submissionQuery =
          trpc.challengeSubmission.getByChallenge.queryOptions({
            tripId,
            challengeId,
          });
        await queryClient.invalidateQueries({
          queryKey: submissionQuery.queryKey,
        });
      },
    }),
  );

  const showSuccessAlert = useCallback((challengeName?: string, points?: number, destinationTripId?: string | null) => {
    const resolvedTripId = destinationTripId ?? tripId;
    Alert.alert(
      "Challenge Completed! 🎉",
      `Congratulations! You've earned ${points ?? 0} points for completing the ${challengeName ?? "challenge"}.`,
      [
        {
          text: "View Challenges",
          onPress: () =>
            router.push(`/trips/challenges?tripId=${resolvedTripId ?? ""}`),
        },
        {
          text: "Stay Here",
          style: "cancel",
        },
      ],
    );
  }, [router, tripId]);

  const submitAsset = useCallback(
    async (
      asset: ImagePicker.ImagePickerAsset,
      challengeName?: string,
      points?: number,
    ) => {
      if (!tripId || !challengeId) {
        Alert.alert("Error", "Missing trip or challenge information.");
        return;
      }

      if (!userTrip) {
        Alert.alert("Error", "User is not part of the trip.");
        return;
      }

      const groupId = userTrip.group?.id;

      if (!groupId) {
        Alert.alert("Error", "Missing group information.");
        return;
      }

      setIsLoading(true);
      try {
        const extension = resolveExtension(asset);
        const storagePath = `challenge/${challengeId}/${groupId}.${extension}`;
        const submission = await submissionMutation.mutateAsync({
          tripId,
          challengeId,
          imageIds: [storagePath],
        });
        setSubmissionId(submission.id);

        if (!asset.fileName || !asset.mimeType) {
          throw new Error("Asset is missing file name or MIME type.");
        }

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName: asset.fileName,
          contentType: asset.mimeType,
          upsert: true,
        });

        setCapturedImage(asset.uri);
        showSuccessAlert(challengeName, points, tripId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to submit challenge";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      challengeId,
      resolveExtension,
      showSuccessAlert,
      submissionMutation,
      tripId,
      upload,
      userTrip,
    ],
  );

  const takePhoto = async (
    onSuccess?: (asset: ImagePicker.ImagePickerAsset) => Promise<void>,
  ) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await onSuccess?.(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImageFromGallery = async (
    onSuccess?: (asset: ImagePicker.ImagePickerAsset) => Promise<void>,
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await onSuccess?.(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleOpenCamera = async (
    challengeName?: string,
    points?: number,
  ) => {
    if (isLoading || submissionMutation.isPending || currentUserLoading) return;
    if (!userTrip) {
      Alert.alert("Error", "User is not part of the trip.");
      return;
    }
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to complete this challenge.",
          [{ text: "OK" }],
        );
        return;
      }

      Alert.alert(
        `${challengeName ?? "Challenge"}`,
        `Complete this challenge to earn ${points ?? 0} points!`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Choose from Gallery",
            onPress: () =>
              void pickImageFromGallery((asset) =>
                submitAsset(asset, challengeName, points),
              ),
          },
          {
            text: "Take Photo",
            onPress: () =>
              void takePhoto((asset) =>
                submitAsset(asset, challengeName, points),
              ),
          },
        ],
      );
    } catch {
      Alert.alert("Error", "Failed to access camera");
    } finally {
      setIsLoading(false);
    }
  };

  const resetCapture = useCallback(() => {
    abortUpload();
    resetUpload();
    setCapturedImage(null);
  }, [abortUpload, resetUpload]);

  const handleRetake = useCallback(async () => {
    abortUpload();
    resetUpload();
    setCapturedImage(null);

    if (submissionId && tripId) {
      try {
        await deleteSubmissionMutation.mutateAsync({
          id: submissionId,
          tripId,
        });
      } catch {
        // Ignore cleanup errors so the user can continue retaking.
      }
    }

    setSubmissionId(null);
  }, [abortUpload, deleteSubmissionMutation, resetUpload, submissionId, tripId]);

  return {
    isLoading: isLoading || currentUserLoading,
    capturedImage,
    setCapturedImage,
    resetCapture,
    handleRetake,
    handleOpenCamera,
    takePhoto,
    pickImageFromGallery,
    showSuccessAlert,
    uploadStatus,
    uploadProgress,
    uploadError,
  };
}
