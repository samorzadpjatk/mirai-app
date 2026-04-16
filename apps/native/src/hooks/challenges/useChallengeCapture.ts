import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "urql";
import {
  GetCurrentUserDocument,
  CreateChallengeSubmissionDocument,
  DeleteChallengeSubmissionDocument,
} from "@mirai-app/frameworks";
import { useFileUpload } from "~/hooks/files";

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

export function useChallengeCapture({
  tripId,
  challengeId,
}: ChallengeCaptureOptions) {
  const router = useRouter();

  const [{ data: userData, fetching: currentUserLoading }] = useQuery({
    query: GetCurrentUserDocument,
    pause: !tripId,
  });

  const [, createSubmission] = useMutation(CreateChallengeSubmissionDocument);
  const [, deleteSubmission] = useMutation(DeleteChallengeSubmissionDocument);

  const userTrip = userData?.me;

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

  const resolveExtension = useCallback((asset: ChallengeUploadAsset) => {
    if (asset.fileName) {
      const parts = asset.fileName.split(".");
      if (parts.length > 1) {
        return parts[parts.length - 1]?.toLowerCase() ?? "jpg";
      }
    }

    const contentType = asset.mimeType ?? "";
    if (contentType === "image/png") return "png";
    if (contentType === "image/webp") return "webp";
    if (contentType === "image/heic" || contentType === "image/heif")
      return "heic";
    if (contentType === "video/quicktime") return "mov";
    if (contentType === "video/x-m4v") return "m4v";
    if (contentType === "video/mp4") return "mp4";
    if (contentType === "video/webm") return "webm";
    return "jpg";
  }, []);

  const resolveMimeType = useCallback((extension: string) => {
    switch (extension) {
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "heic":
      case "heif":
        return "image/heic";
      case "mov":
        return "video/quicktime";
      case "m4v":
        return "video/x-m4v";
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      default:
        return "image/jpeg";
    }
  }, []);

  const resolveFileName = useCallback(
    (asset: ChallengeUploadAsset, extension: string) => {
      if (asset.fileName && asset.fileName.trim().length > 0) {
        return asset.fileName;
      }

      const uriLastSegment = asset.uri.split("/").pop();
      if (uriLastSegment?.includes(".")) {
        return uriLastSegment;
      }

      return `challenge-${Date.now()}.${extension}`;
    },
    [],
  );

  const showSuccessAlert = useCallback(
    (
      challengeName?: string,
      points?: number,
      destinationTripId?: string | null,
    ) => {
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

      // Find user's group for this trip
      const participation = userTrip.participations?.find(
        (p) => p.trip?.id === tripId,
      );
      const groupId = participation?.group?.id;

      if (!groupId) {
        Alert.alert("Error", "Missing group information.");
        return;
      }

      setIsLoading(true);
      let createdSubmissionId: string | null = null;
      try {
        const extension = resolveExtension(asset);
        const storagePath = `challenge/${challengeId}/${groupId}-${Date.now()}.${extension}`;

        const result = await createSubmission({
          input: {
            tripId,
            challengeId,
            imageIds: [storagePath],
            latitude: submissionLocation?.latitude,
            longitude: submissionLocation?.longitude,
          },
        });

        if (result.error) {
          throw result.error;
        }

        createdSubmissionId =
          result.data?.createChallengeSubmission?.id ?? null;
        setSubmissionId(createdSubmissionId);

        const fileName = resolveFileName(asset, extension);
        const contentType = asset.mimeType ?? resolveMimeType(extension);

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName,
          contentType,
          upsert: true,
        });

        setCapturedImage(asset.uri);
        showSuccessAlert(challengeName, points, tripId);
      } catch (error) {
        if (createdSubmissionId) {
          try {
            await deleteSubmission({ id: createdSubmissionId });
          } catch {
            // Ignore cleanup failures, original upload error is shown below.
          }
        }
        const message =
          error instanceof Error ? error.message : "Failed to submit challenge";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      challengeId,
      deleteSubmission,
      resolveExtension,
      resolveFileName,
      resolveMimeType,
      showSuccessAlert,
      createSubmission,
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
    async (
      asset: ChallengeUploadAsset,
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

      // Find user's group for this trip
      const participation = userTrip.participations?.find(
        (p) => p.trip?.id === tripId,
      );
      const groupId = participation?.group?.id;

      if (!groupId) {
        Alert.alert("Error", "Missing group information.");
        return;
      }

      setIsLoading(true);
      let createdSubmissionId: string | null = null;
      try {
        const extension = resolveExtension(asset);
        const storagePath = `challenge/${challengeId}/${groupId}-${Date.now()}.${extension}`;

        const result = await createSubmission({
          input: {
            tripId,
            challengeId,
            videoId: storagePath,
          },
        });

        if (result.error) {
          throw result.error;
        }

        createdSubmissionId =
          result.data?.createChallengeSubmission?.id ?? null;
        setSubmissionId(createdSubmissionId);

        const fileName = resolveFileName(asset, extension);
        const contentType = asset.mimeType ?? resolveMimeType(extension);

        await upload({
          storagePath,
          fileUri: asset.uri,
          fileName,
          contentType,
          upsert: true,
        });

        setCapturedImage(null);
        showSuccessAlert(challengeName, points, tripId);
      } catch (error) {
        if (createdSubmissionId) {
          try {
            await deleteSubmission({ id: createdSubmissionId });
          } catch {
            // Ignore cleanup failures, original upload error is shown below.
          }
        }
        const message =
          error instanceof Error ? error.message : "Failed to submit challenge";
        Alert.alert("Upload Failed", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      challengeId,
      deleteSubmission,
      resolveExtension,
      resolveFileName,
      resolveMimeType,
      showSuccessAlert,
      createSubmission,
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

    if (submissionId) {
      try {
        await deleteSubmission({ id: submissionId });
      } catch {
        // Ignore cleanup errors so the user can continue retaking.
      }
    }

    setSubmissionId(null);
  }, [abortUpload, deleteSubmission, resetUpload, submissionId]);

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
