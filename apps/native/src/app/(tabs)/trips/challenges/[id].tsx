import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, YStack } from "@mirai-app/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useClient } from "urql";
import {
  GetChallengeSubmissionsDocument,
  GetChallengeSubmissionByChallengeAndGroupDocument,
  CreateChallengeSubmissionDocument,
  DeleteChallengeSubmissionDocument,
  GetTripDocument,
} from "@mirai-app/graphql-client";
import { QrScannerModal } from "~/components/common";
import { AppModalShell, AppModalFooter } from "~/components/common/ui";
import { ThemedTextInput } from "~/components/common/ui";
import { useCameraPermissions } from "expo-camera";
import {
  MapView,
  Camera,
  UserLocation as MapLibreUserLocation,
  PointAnnotation,
  RasterSource,
  RasterLayer,
} from "@maplibre/maplibre-react-native";
import { deleteCachedDownload } from "~/hooks/files";
import { ChallengeActionButton } from "~/components/trips/challenges/ChallengeActionButton";
import { ChallengeDescriptionCard } from "~/components/trips/challenges/ChallengeDescriptionCard";
import { ChallengeHeroCard } from "~/components/trips/challenges/ChallengeHeroCard";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";
import { ChallengeTimeLeftCard } from "~/components/trips/challenges/ChallengeTimeLeftCard";
import { ChallengeUploadProgressCard } from "~/components/trips/challenges/ChallengeUploadProgressCard";
import { ExistingSubmissionCard } from "~/components/trips/challenges/ExistingSubmissionCard";
import { ChallengeCommunitySubmissionsCard } from "~/components/trips/challenges/ChallengeCommunitySubmissionsCard";
import { PhotoCaptureModal } from "~/components/camera/PhotoCaptureModal";
import { useChallengeDetails } from "~/hooks/challenges";
import { useChallengeCapture } from "~/hooks/challenges";
import { useTripDetails } from "~/hooks/trips";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/fiord";
const IMAGE_LOCATION_RADIUS_METERS = 50;

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

const calculateDistanceMeters = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) => {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const haversineValue =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle * 1000;
};

const isOnOrBeforeNow = (value?: string | Date | null) => {
  if (!value) return false;
  return Date.now() <= new Date(value).getTime();
};

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const client = useClient();
  const params = useLocalSearchParams();
  const challengeId =
    typeof params.id === "string" ? params.id : params.id?.[0];
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const insets = useSafeAreaInsets();

  const {
    challenge,
    isLoading: challengeLoading,
    isAssignedToUser,
  } = useChallengeDetails(challengeId, tripId);

  const { isTripPast } = useTripDetails(tripId);

  const {
    isLoading: cameraLoading,
    capturedImage,
    setCapturedImage,
    submitAsset,
    submitCapturedPhoto,
    pickImageFromGallery,
    pickVideoFromGallery,
    submitVideoAsset,
    uploadStatus,
    uploadProgress,
  } = useChallengeCapture({
    tripId,
    challengeId,
  });
  const isUploading = uploadStatus === "uploading";
  const uploadPercent =
    uploadProgress.percent != null
      ? Math.round(uploadProgress.percent * 100)
      : null;
  const uploadLabel = isUploading
    ? uploadPercent != null
      ? `Uploading ${uploadPercent}%`
      : "Uploading..."
    : undefined;

  // GraphQL queries - using tuple destructuring with reexecute functions
  const [{ data: mySubmission }, reexecuteMySubmission] = useQuery({
    query: GetChallengeSubmissionByChallengeAndGroupDocument,
    variables: { challengeId: challengeId ?? "", tripId: tripId ?? "" },
    pause: !challengeId || !tripId,
  });
  const [{ data: challengeSubmissionsData }, reexecuteSubmissions] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: { challengeId: challengeId ?? "", tripId: tripId ?? "" },
    pause: !challengeId || !tripId,
  });
  const [{ data: trip }] = useQuery({
    query: GetTripDocument,
    variables: { id: tripId ?? "" },
    pause: !tripId,
  });

  const challengeSubmissions =
    challengeSubmissionsData?.challengeSubmissions?.submissions ?? [];

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isPhotoCameraOpen, setIsPhotoCameraOpen] = useState(false);
  const [isUsingCapturedPhoto, setIsUsingCapturedPhoto] = useState(false);
  const [imageSubmissionCoords, setImageSubmissionCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isTextInputOpen, setIsTextInputOpen] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [currentDeviceCoords, setCurrentDeviceCoords] = useState<
    [number, number] | null
  >(null);

  // GraphQL mutations
  const [, withdrawSubmission] = useMutation(DeleteChallengeSubmissionDocument);
  const [, createSubmission] = useMutation(CreateChallengeSubmissionDocument);

  // Loading states for mutations
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  const refreshSubmissionQueries = async () => {
    // Reexecute queries with network-only policy to refresh data
    await Promise.all([
      reexecuteMySubmission({ requestPolicy: "network-only" }),
      reexecuteSubmissions({ requestPolicy: "network-only" }),
    ]);
  };

  const handleWithdraw = async (submissionId: string) => {
    if (!tripId) return;
    try {
      setIsWithdrawing(true);
      const result = await withdrawSubmission({ id: submissionId, tripId });
      if (result.error) {
        throw result.error;
      }
      await refreshSubmissionQueries();
      if (mySubmission?.challengeSubmissionByChallengeAndGroup?.imageIds?.[0]) {
        await deleteCachedDownload(
          mySubmission.challengeSubmissionByChallengeAndGroup.imageIds[0],
        );
      }
      setCapturedImage(null);
      Alert.alert("Submission withdrawn", "You can submit again now.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to withdraw submission";
      Alert.alert("Error", message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!challengeId || !tripId || challengeLoading) {
    return <ChallengeLoadingState />;
  }

  if (!challenge) {
    return (
      <View flex={1} backgroundColor="$backgroundDark">
        <ChallengeNotFoundState onGoBack={() => router.back()} />
      </View>
    );
  }

  const isPeerVotingChallengeInVotingPhase =
    challenge.scoringCategory === "PEER_VOTING" &&
    challenge.status === "VOTING_PHASE";

  const isQrChallenge = challenge.submissionType === "QR_CODE";
  const isVideoChallenge = challenge.submissionType === "VIDEO";
  const isLocationChallenge = challenge.submissionType === "LOCATION";
  const isTextChallenge = challenge.submissionType === "TEXT";
  const hasTargetLocation =
    typeof challenge.targetLatitude === "number" &&
    typeof challenge.targetLongitude === "number";
  const shouldShowTargetLocationCard =
    (challenge.submissionType === "LOCATION" ||
      challenge.submissionType === "IMAGE_LOCATION") &&
    hasTargetLocation;
  const shouldShowSolvedCounterOnly =
    challenge.submissionType === "QR_CODE" ||
    challenge.submissionType === "TEXT" ||
    challenge.submissionType === "LOCATION";
  const isImageBasedChallenge =
    challenge.submissionType === "IMAGE" ||
    challenge.submissionType === "MULTI_IMAGE" ||
    challenge.submissionType === "IMAGE_LOCATION";
  const approvedGroupsCount =
    challengeSubmissions?.filter(
      (submission) => submission.status === "APPROVED",
    ).length ?? 0;
  const submittedGroupsCount = challengeSubmissions?.length ?? 0;
  const pendingReviewGroupsCount =
    challengeSubmissions?.filter(
      (submission) => submission.status === "PENDING",
    ).length ?? 0;
  const isAwaitingStaffReview = pendingReviewGroupsCount > 0;
  const shouldHideStaffSubmissionsGallery =
    challenge.scoringCategory === "JUDGED_STAFF" &&
    challenge.status !== "COMPLETED";
  const shouldShowPendingReviewCounter =
    isAwaitingStaffReview &&
    (isImageBasedChallenge || shouldShowSolvedCounterOnly);
  const totalGroupsCount = trip?.trip?.groups?.length ?? 0;

  const validateImageLocationSubmission = () => {
    if (challenge.submissionType !== "IMAGE_LOCATION") {
      return null;
    }

    if (!hasTargetLocation) {
      Alert.alert(
        "Location unavailable",
        "Target location for this challenge is not configured.",
      );
      return undefined;
    }

    if (!currentDeviceCoords) {
      Alert.alert(
        "Location unavailable",
        "Waiting for your current location. Keep this screen open for a moment and try again.",
      );
      return undefined;
    }

    const [longitude, latitude] = currentDeviceCoords;
    const distanceMeters = calculateDistanceMeters(
      latitude,
      longitude,
      challenge.targetLatitude!,
      challenge.targetLongitude!,
    );

    if (distanceMeters > IMAGE_LOCATION_RADIUS_METERS) {
      Alert.alert(
        "Too far from target",
        `Podejdź bliżej punktu zadania i spróbuj ponownie. Jesteście teraz około ${Math.round(distanceMeters)} m od celu.`,
      );
      return undefined;
    }

    return { latitude, longitude };
  };

  const handleSendCurrentLocation = async () => {
    if (!tripId || !challengeId) return;
    if (!currentDeviceCoords) {
      Alert.alert(
        "Location unavailable",
        "Waiting for your current location. Keep this screen open for a moment and try again.",
      );
      return;
    }
    try {
      setIsSubmittingLocation(true);
      const result = await createSubmission({
        tripId,
        challengeId,
        latitude: currentDeviceCoords[1],
        longitude: currentDeviceCoords[0],
      });
      if (result.error) {
        throw result.error;
      }
      const submission = result.data?.createChallengeSubmission;
      await refreshSubmissionQueries();
      Alert.alert(
        "Location sent",
        submission?.status === "APPROVED"
          ? "Location verified. Points granted."
          : "Location submission sent.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send location";
      Alert.alert("Location failed", message);
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleSubmitText = async (text: string) => {
    if (!tripId || !challengeId) return;
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a text answer.");
      return;
    }
    try {
      setIsSubmittingText(true);
      const result = await createSubmission({
        tripId,
        challengeId,
        textContent: trimmed,
      });
      if (result.error) {
        throw result.error;
      }
      const submission = result.data?.createChallengeSubmission;
      await refreshSubmissionQueries();
      setIsTextInputOpen(false);
      setTextInputValue("");
      Alert.alert(
        "Submitted",
        submission?.status === "APPROVED"
          ? "Correct! Points granted."
          : "Answer submitted.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit";
      Alert.alert("Incorrect", message);
    } finally {
      setIsSubmittingText(false);
    }
  };

  const handleOpenChallengeCamera = () => {
    void (async () => {
      const validatedLocation = validateImageLocationSubmission();
      if (validatedLocation === undefined) {
        return;
      }
      const permission = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();
      if (!permission?.granted) {
        Alert.alert(
          "Permission required",
          "Camera permission is needed to complete this challenge.",
        );
        return;
      }
      setImageSubmissionCoords(validatedLocation ?? null);
      setIsPhotoCameraOpen(true);
    })();
  };

  const handleImageChallengeAction = () => {
    const challengeName = challenge.name;
    const challengePoints = challenge.basePoints ?? 0;

    Alert.alert(
      `${challengeName}`,
      `Complete this challenge to earn ${challengePoints} points!`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Choose from Gallery",
          onPress: () => {
            const validatedLocation = validateImageLocationSubmission();
            if (validatedLocation === undefined) {
              return;
            }
            void pickImageFromGallery((asset) =>
              submitAsset(
                asset,
                challengeName,
                challengePoints,
                validatedLocation ?? undefined,
              ),
            );
          },
        },
        {
          text: "Take Photo",
          onPress: handleOpenChallengeCamera,
        },
      ],
    );
  };

  const handleVideoChallengeAction = () => {
    const challengeName = challenge.name;
    const challengePoints = challenge.basePoints ?? 0;

    void pickVideoFromGallery((asset) =>
      submitVideoAsset(asset, challengeName, challengePoints),
    );
  };

  const handleUseChallengePhoto = async (photo: {
    uri: string;
    mimeType: "image/jpeg" | "image/png";
  }) => {
    try {
      setIsUsingCapturedPhoto(true);
      await submitCapturedPhoto(
        photo,
        challenge.name,
        challenge.basePoints ?? 0,
        imageSubmissionCoords ?? undefined,
      );
      setIsPhotoCameraOpen(false);
    } finally {
      setIsUsingCapturedPhoto(false);
      setImageSubmissionCoords(null);
    }
  };

  const isVotingPhase = challenge.status === "VOTING_PHASE";
  const isWithinVotingWindow =
    challenge.scoringCategory === "PEER_VOTING" && isVotingPhase;
  const shouldShowVotingTime =
    challenge.scoringCategory === "PEER_VOTING" &&
    (isVotingPhase || isWithinVotingWindow);
  const shouldShowSubmissionTime = !shouldShowVotingTime;
  const isSubmissionWindowOpen =
    !challenge.endTime || isOnOrBeforeNow(challenge.endTime);
  const canSubmitNow = challenge.status === "ACTIVE" && isSubmissionWindowOpen;
  const heroStatus =
    challenge.status !== "CANCELLED" && isWithinVotingWindow
      ? "VOTING_PHASE"
      : challenge.status;

  return (
    <View flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 96 + 64, // xxxl (64) + 96
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Icon & Status */}
        <ChallengeHeroCard
          name={challenge.name}
          points={challenge.basePoints ?? 0}
          isSelected={isAssignedToUser}
          imageUrl={challenge.image}
          submissionType={challenge.submissionType}
          scoringCategory={challenge.scoringCategory}
          status={heroStatus}
          endTime={challenge.endTime}
        />

        {/* Description */}
        <ChallengeDescriptionCard description={challenge.description} />

        {isPeerVotingChallengeInVotingPhase && (
          <ChallengeActionButton
            isLoading={false}
            label="Vote"
            iconName="checkmark-circle"
            onPress={() =>
              router.push(
                `/trips/challenges/vote/${challenge.id}?tripId=${tripId}`,
              )
            }
          />
        )}

        {/* Primary action */}
        {!isPeerVotingChallengeInVotingPhase &&
          !mySubmission?.challengeSubmissionByChallengeAndGroup &&
          challenge.status !== "COMPLETED" &&
          !isTripPast && (
            <ChallengeActionButton
              isLoading={
                cameraLoading ||
                isSubmittingQr ||
                isSubmittingLocation ||
                isSubmittingText
              }
              disabled={!canSubmitNow}
              label={
                isQrChallenge
                  ? isSubmittingQr
                    ? "Checking QR..."
                    : "Scan QR code"
                  : isVideoChallenge
                    ? (uploadLabel ?? "Take Challenge Video")
                    : isLocationChallenge
                      ? isSubmittingLocation
                        ? "Sending location..."
                        : "Send current location"
                      : isTextChallenge
                        ? isSubmittingText
                          ? "Submitting..."
                          : "Enter answer"
                        : uploadLabel
              }
              iconName={
                isVideoChallenge
                  ? "videocam"
                  : isLocationChallenge
                    ? "location"
                    : isTextChallenge
                      ? "document-text"
                      : isQrChallenge
                        ? "qr-code"
                        : "camera"
              }
              onPress={async () => {
                if (!canSubmitNow) {
                  return;
                }
                if (isQrChallenge) {
                  setIsQrScannerOpen(true);
                  return;
                }
                if (isLocationChallenge) {
                  await handleSendCurrentLocation();
                  return;
                }
                if (isTextChallenge) {
                  setTextInputValue("");
                  setIsTextInputOpen(true);
                  return;
                }
                if (isVideoChallenge) {
                  handleVideoChallengeAction();
                  return;
                }
                void handleImageChallengeAction();
              }}
            />
          )}

        {shouldShowSubmissionTime ? (
          <ChallengeTimeLeftCard
            phaseLabel="Submission"
            isRecurring={challenge.isRecurring}
            status={challenge.status}
            startTime={challenge.startTime}
            endTime={challenge.endTime}
            dailyStartTime={challenge.dailyStartTime}
            dailyEndTime={challenge.dailyEndTime}
          />
        ) : null}

        {shouldShowVotingTime ? (
          <ChallengeTimeLeftCard
            phaseLabel="Voting"
            startTime={challenge.votingStartTime ?? challenge.startTime}
            endTime={challenge.votingEndTime ?? challenge.endTime}
          />
        ) : null}

        {shouldShowTargetLocationCard ? (
          <View
            backgroundColor="$cardDark"
            borderRadius={14}
            borderWidth={1}
            borderColor="$whiteOpacity8"
            padding="$lg"
            marginBottom="$lg"
          >
            <Text
              color="$emerald500"
              fontSize={12}
              textTransform="uppercase"
              marginBottom={8}
              letterSpacing={0.8}
              fontWeight="700"
            >
              Target location
            </Text>
            <View
              height={180}
              borderRadius={12}
              overflow="hidden"
              borderWidth={1}
              borderColor="$whiteOpacity12"
            >
              <MapView mapStyle={MAP_STYLE} style={{ flex: 1 }}>
                <Camera
                  defaultSettings={{
                    centerCoordinate: [
                      challenge.targetLongitude!,
                      challenge.targetLatitude!,
                    ],
                    zoomLevel: 15,
                  }}
                />
                <RasterSource
                  id="opensnowmap-pistes-user"
                  tileUrlTemplates={[
                    "https://tiles.opensnowmap.org/tiles-pistes-high-dpi/{z}/{x}/{y}.png",
                  ]}
                  tileSize={256}
                  attribution="© OpenSnowMap.org"
                >
                  <RasterLayer
                    id="opensnowmap-overlay-user"
                    sourceID="opensnowmap-pistes-user"
                    style={{ rasterOpacity: 0.9 }}
                  />
                </RasterSource>
                <PointAnnotation
                  id="challenge-target"
                  coordinate={[
                    challenge.targetLongitude!,
                    challenge.targetLatitude!,
                  ]}
                >
                  <View
                    width={18}
                    height={18}
                    borderRadius={9}
                    backgroundColor="$danger"
                    borderWidth={2}
                    borderColor="$whiteOpacity90"
                  />
                </PointAnnotation>
                <MapLibreUserLocation
                  visible
                  minDisplacement={0}
                  onUpdate={(location) => {
                    const longitude = location.coords?.longitude;
                    const latitude = location.coords?.latitude;
                    if (
                      typeof longitude !== "number" ||
                      typeof latitude !== "number"
                    ) {
                      return;
                    }
                    setCurrentDeviceCoords([longitude, latitude]);
                  }}
                />
              </MapView>
            </View>
            <Text color="$emerald500" marginTop={8} fontSize={12}>
              {Number(challenge.targetLatitude).toFixed(5)},{" "}
              {Number(challenge.targetLongitude).toFixed(5)}
            </Text>
          </View>
        ) : null}

        {shouldShowPendingReviewCounter &&
        !shouldHideStaffSubmissionsGallery ? (
          <View
            backgroundColor="$cardDark"
            borderRadius={14}
            borderWidth={1}
            borderColor="$whiteOpacity8"
            padding="$lg"
            marginBottom="$lg"
          >
            <Text
              color="$emerald500"
              fontSize={12}
              textTransform="uppercase"
              marginBottom={4}
              letterSpacing={0.8}
              fontWeight="700"
            >
              Groups submitted
            </Text>
            <Text color="$emerald500" fontSize={28} fontWeight="800">
              {submittedGroupsCount}/{totalGroupsCount}
            </Text>
            <Text color="$emerald500" fontSize={12} marginTop="$xs">
              Waiting for staff review: {pendingReviewGroupsCount}
            </Text>
          </View>
        ) : null}

        {shouldHideStaffSubmissionsGallery ? (
          <View
            backgroundColor="$cardDark"
            borderRadius={14}
            borderWidth={1}
            borderColor="$whiteOpacity8"
            padding="$lg"
            marginBottom="$lg"
          >
            <Text
              color="$emerald500"
              fontSize={12}
              textTransform="uppercase"
              marginBottom={4}
              letterSpacing={0.8}
              fontWeight="700"
            >
              Groups submissions
            </Text>
            <Text color="$emerald500" fontSize={28} fontWeight="800">
              {submittedGroupsCount}/{totalGroupsCount}
            </Text>
            <Text color="$emerald500" fontSize={12} marginTop="$xs">
              Photos will be visible after staff voting ends.
            </Text>
          </View>
        ) : shouldShowSolvedCounterOnly ? (
          <View
            backgroundColor="$cardDark"
            borderRadius={14}
            borderWidth={1}
            borderColor="$whiteOpacity8"
            padding="$lg"
            marginBottom="$lg"
          >
            <Text
              color="$emerald500"
              fontSize={12}
              textTransform="uppercase"
              marginBottom={4}
              letterSpacing={0.8}
              fontWeight="700"
            >
              Solved groups
            </Text>
            <Text color="$emerald500" fontSize={28} fontWeight="800">
              {approvedGroupsCount}/{totalGroupsCount}
            </Text>
          </View>
        ) : (
          <ChallengeCommunitySubmissionsCard
            submissions={challengeSubmissions ?? []}
            showPodium={
              challenge.scoringCategory === "SPEED" ||
              challenge.scoringCategory === "PEER_VOTING" ||
              challenge.scoringCategory === "JUDGED_STAFF"
            }
          />
        )}

        {isUploading && (
          <ChallengeUploadProgressCard progress={uploadProgress.percent} />
        )}

        {mySubmission?.challengeSubmissionByChallengeAndGroup &&
          !isTripPast && (
            <ExistingSubmissionCard
              submission={mySubmission.challengeSubmissionByChallengeAndGroup}
              isWithdrawing={isWithdrawing}
              localPreviewUri={capturedImage}
              onWithdraw={handleWithdraw}
            />
          )}
      </ScrollView>

      <AppModalShell
        visible={isTextInputOpen}
        title="Enter your answer"
        onClose={() => {
          setIsTextInputOpen(false);
          setTextInputValue("");
        }}
        variant="pageSheet"
      >
        <ThemedTextInput
          placeholder="Type your answer here..."
          value={textInputValue}
          onChangeText={setTextInputValue}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={() => handleSubmitText(textInputValue)}
          style={{ marginBottom: 16 }}
        />
        <AppModalFooter
          primaryLabel={isSubmittingText ? "Submitting..." : "Submit"}
          onPrimary={() => handleSubmitText(textInputValue)}
          isPrimaryLoading={isSubmittingText}
          isPrimaryDisabled={!textInputValue.trim()}
          secondaryLabel="Cancel"
          onSecondary={() => {
            setIsTextInputOpen(false);
            setTextInputValue("");
          }}
        />
      </AppModalShell>

      <PhotoCaptureModal
        visible={isPhotoCameraOpen}
        title={challenge.name}
        facing="back"
        isUsingPhoto={isUsingCapturedPhoto}
        onClose={() => {
          setIsPhotoCameraOpen(false);
          setImageSubmissionCoords(null);
        }}
        onUsePhoto={handleUseChallengePhoto}
      />

      <QrScannerModal
        visible={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        title="Scan QR code"
        instructionText="Point camera at QR code to verify challenge."
        onScan={async (data) => {
          if (!tripId || !challengeId) return;

          try {
            setIsSubmittingQr(true);
            const result = await createSubmission({
              tripId,
              challengeId,
              textContent: data,
            });
            if (result.error) {
              throw result.error;
            }
            const submission = result.data?.createChallengeSubmission;
            await refreshSubmissionQueries();
            Alert.alert(
              "Challenge completed",
              submission?.status === "APPROVED"
                ? "QR code valid. Points granted."
                : "Submission sent.",
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Invalid QR code";
            throw new Error(message);
          } finally {
            setIsSubmittingQr(false);
          }
        }}
      />
    </View>
  );
}
