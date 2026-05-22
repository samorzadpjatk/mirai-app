import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateChallengeQueries } from "@mirai-app/orpc/client/query";
import { useFileUpload } from "~/hooks/files";
import { getFileExtension, getFileContentType, getUploadFileName } from "~/utils/image";

interface ChallengeCaptureOptions {
  tripId: string | undefined;
  challengeId: string | undefined;
}
interface ChallengeUploadAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface SubmissionLocation {
  latitude: number;
  longitude: number;
}

export function validateChallengeSubmission(
  tripId: string | undefined,
  challengeId: string | undefined,
  userTrip: { trips?: { tripId: string; group?: { id: string } }[] } | null | undefined,
): string | null {
  if (!tripId || !challengeId) return null;
  if (!userTrip) return null;
  const userTripForCurrentTrip = userTrip?.trips?.find((t) => t.tripId === tripId);
  return userTripForCurrentTrip?.group?.id ?? null;
}

export function buildStoragePath(
  challengeId: string,
  groupId: string,
  extension: string,
  now: number = Date.now(),
): string {
  return `challenge/${challengeId}/${groupId}-${now}.${extension}`;
}

export function buildUploadConfig(
  asset: ChallengeUploadAsset,
  storagePath: string,
  extension: string,
  type: "image" | "video" = "image",
) {
  const fileName = getUploadFileName(asset, extension, "challenge");
  const contentType = asset.mimeType ?? getFileContentType(extension);
  return { storagePath, fileUri: asset.uri, fileName, contentType, upsert: true };
}

export function useChallengeCapture({ tripId, challengeId }: ChallengeCaptureOptions) {
  const router = useRouter();

  const queryClient = useQueryClient();
  const userQuery = useQuery(
    orpc.user.getMyWithGroup.queryOptions({ input: { tripId: tripId ?? "" }, enabled: !!tripId }),
  );
  const createSubmissionMutation = useMutation(
    orpc.challengeSubmission.create.mutationOptions({
      onSuccess: async () => {
        await invalidateChallengeQueries(queryClient);
      },
    }),
  );
  const deleteSubmissionMutation = useMutation(
    orpc.challengeSubmission.deleteMine.mutationOptions({
      onSuccess: async () => {
        await invalidateChallengeQueries(queryClient);
      },
    }),
  );

  const userTrip = userQuery.data;
  const currentUserLoading = userQuery.isLoading;

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

  const showSuccessAlert = useCallback(
    (challengeName?: string, points?: number, destinationTripId?: string | null) => {
      const resolvedTripId = destinationTripId ?? tripId;
      Alert.alert(
        "Submission sent",
        "Zgłoszenie zostało wysłane i czeka na zaakceptowanie przez kadrę. Dostaniesz powiadomienie, gdy zostanie zaakceptowane.",
        [
          {
            text: "View Challenges",
            onPress: () =>
              router.push({
                pathname: "/(tabs)/trips/challenges/index",
                params: {
                  tripId: resolvedTripId ?? "",
                },
              }),
          },
          {
            text: "Stay Here",
            style: "cancel",
          },
        ],
      );
    },
    [router, tripId],
  );

  const submitAsset = useCallback(
    async (
      asset: ChallengeUploadAsset,
      challengeName?: string,
      points?: number,
      submissionLocation?: SubmissionLocation,
    ) => {
      if (!tripId || !challengeId) {
        Alert.alert("Error", "Missing trip or challenge information.");
        return;
      }

      if (!userTrip) {
        Alert.alert("Error", "User is not part of the trip.");
        return;
      }

      const userTripForCurrentTrip = userTrip?.trips?.find((t) => t.tripId === tripId);
      const groupId = userTripForCurrentTrip?.group?.id;

      if (!groupId) {
        Alert.alert("Error", "Missing group information.");
        return;
      }

      setIsLoading(true);
      let createdSubmissionId: string | null = null;
      try {
        const extension = getFileExtension(asset);
        const storagePath = buildStoragePath(challengeId, groupId, extension);
        const submission = await createSubmissionMutation.mutateAsync({
          tripId,
          challengeId,
          imageIds: [storagePath],
          latitude: submissionLocation?.latitude,
          longitude: submissionLocation?.longitude,
        });
        createdSubmissionId = submission.id;
        setSubmissionId(submission.id);

        const config = buildUploadConfig(asset, storagePath, extension);
        await upload(config);

        setCapturedImage(asset.uri);
        showSuccessAlert(challengeName, points, tripId);
      } catch (error) {
        if (createdSubmissionId && tripId) {
          try {
            await deleteSubmissionMutation.mutateAsync({
              id: createdSubmissionId,
              tripId,
            });
          } catch {
            // Ignore cleanup failures, original upload error is shown below.
          }
        }
        const message = error instanceof Error ? error.message : "Failed to submit challenge";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      challengeId,
      deleteSubmissionMutation,
      showSuccessAlert,
      createSubmissionMutation,
      tripId,
      upload,
      userTrip,
    ],
  );

  const pickImageFromGallery = async (
    onSuccess?: (asset: ChallengeUploadAsset) => Promise<void>,
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        await onSuccess?.(selectedAsset);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickVideoFromGallery = async (
    onSuccess?: (asset: ChallengeUploadAsset) => Promise<void>,
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "videos",
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await onSuccess?.(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick video");
    }
  };

  const submitVideoAsset = useCallback(
    async (asset: ChallengeUploadAsset, challengeName?: string, points?: number) => {
      if (!tripId || !challengeId) {
        Alert.alert("Error", "Missing trip or challenge information.");
        return;
      }

      if (!userTrip) {
        Alert.alert("Error", "User is not part of the trip.");
        return;
      }

      const userTripForCurrentTrip = userTrip?.trips?.find((t) => t.tripId === tripId);
      const groupId = userTripForCurrentTrip?.group?.id;

      if (!groupId) {
        Alert.alert("Error", "Missing group information.");
        return;
      }

      setIsLoading(true);
      let createdSubmissionId: string | null = null;
      try {
        const extension = getFileExtension(asset);
        const storagePath = buildStoragePath(challengeId, groupId, extension);
        const submission = await createSubmissionMutation.mutateAsync({
          tripId,
          challengeId,
          videoId: storagePath,
        });
        createdSubmissionId = submission.id;
        setSubmissionId(submission.id);

        const config = buildUploadConfig(asset, storagePath, extension);
        await upload(config);

        setCapturedImage(null);
        showSuccessAlert(challengeName, points, tripId);
      } catch (error) {
        if (createdSubmissionId && tripId) {
          try {
            await deleteSubmissionMutation.mutateAsync({
              id: createdSubmissionId,
              tripId,
            });
          } catch {
            // Ignore cleanup failures, original upload error is shown below.
          }
        }
        const message = error instanceof Error ? error.message : "Failed to submit challenge";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      challengeId,
      deleteSubmissionMutation,
      showSuccessAlert,
      createSubmissionMutation,
      tripId,
      upload,
      userTrip,
    ],
  );

  const submitCapturedPhoto = useCallback(
    async (
      photo: { uri: string; mimeType: "image/jpeg" | "image/png" },
      challengeName?: string,
      points?: number,
      submissionLocation?: SubmissionLocation,
    ) => {
      const extension = photo.mimeType === "image/png" ? "png" : "jpg";
      await submitAsset(
        {
          uri: photo.uri,
          fileName: `challenge-${Date.now()}.${extension}`,
          mimeType: photo.mimeType,
        },
        challengeName,
        points,
        submissionLocation,
      );
    },
    [submitAsset],
  );

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
    submitAsset,
    submitCapturedPhoto,
    pickImageFromGallery,
    pickVideoFromGallery,
    submitVideoAsset,
    showSuccessAlert,
    uploadStatus,
    uploadProgress,
    uploadError,
  };
}
