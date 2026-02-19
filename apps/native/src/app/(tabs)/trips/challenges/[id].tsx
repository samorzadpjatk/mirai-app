import { useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { CameraView, useCameraPermissions } from "expo-camera";
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
import { useChallengeDetails } from "~/hooks/challenges";
import { useChallengeCapture } from "~/hooks/challenges";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/fiord";
const isOnOrAfterNow = (value?: string | Date | null) => {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
};
const isOnOrBeforeNow = (value?: string | Date | null) => {
  if (!value) return false;
  return Date.now() <= new Date(value).getTime();
};

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const challengeId =
    typeof params.id === "string" ? params.id : params.id?.[0];
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const insets = useAppSafeAreaInsets();

  const {
    challenge,
    isLoading: challengeLoading,
    isAssignedToUser,
  } = useChallengeDetails(challengeId, tripId);

  const {
    isLoading: cameraLoading,
    capturedImage,
    setCapturedImage,
    handleOpenCamera,
    uploadStatus,
    uploadProgress,
  } = useChallengeCapture({ tripId, challengeId });
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

  const submissionQuery = trpc.challengeSubmission.getMyForChallenge.queryOptions(
    {
      challengeId: challengeId ?? "",
      tripId: tripId ?? "",
    },
  );
  const challengeSubmissionsQuery =
    trpc.challengeSubmission.getByChallenge.queryOptions({
      challengeId: challengeId ?? "",
      tripId: tripId ?? "",
    });

  const { data: mySubmission } = useQuery({
    ...submissionQuery,
    enabled: !!challengeId && !!tripId,
  });
  const { data: challengeSubmissions } = useQuery({
    ...challengeSubmissionsQuery,
    enabled: !!challengeId && !!tripId,
  });
  const { data: trip } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId,
  });
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [hasScannedQrThisSession, setHasScannedQrThisSession] =
    useState(false);
  const [currentDeviceCoords, setCurrentDeviceCoords] = useState<
    [number, number] | null
  >(null);
  const qrScanLockRef = useRef(false);

  const withdrawMutation = useMutation(
    trpc.challengeSubmission.deleteMine.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: submissionQuery.queryKey });
        await queryClient.invalidateQueries({
          queryKey: challengeSubmissionsQuery.queryKey,
        });
      },
    }),
  );
  const qrSubmitMutation = useMutation(
    trpc.challengeSubmission.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: submissionQuery.queryKey });
        await queryClient.invalidateQueries({
          queryKey: challengeSubmissionsQuery.queryKey,
        });
      },
    }),
  );
  const locationSubmitMutation = useMutation(
    trpc.challengeSubmission.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: submissionQuery.queryKey });
        await queryClient.invalidateQueries({
          queryKey: challengeSubmissionsQuery.queryKey,
        });
      },
    }),
  );

  const handleWithdraw = async (submissionId: string) => {
    if (!tripId) return;
    try {
      await withdrawMutation.mutateAsync({ id: submissionId, tripId });
      if (mySubmission?.imageIds?.[0]) {
        await deleteCachedDownload(mySubmission.imageIds[0]);
      }
      setCapturedImage(null);
      Alert.alert("Submission withdrawn", "You can submit again now.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to withdraw submission";
      Alert.alert("Error", message);
    }
  };

  if (!challengeId || !tripId || challengeLoading) {
    return <ChallengeLoadingState />;
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <ChallengeNotFoundState onGoBack={() => router.back()} />
      </View>
    );
  }

  const isPeerVotingChallengeInVotingPhase =
    challenge.scoringCategory === "PEER_VOTING" &&
    challenge.status === "VOTING_PHASE";

  const isQrChallenge = challenge.submissionType === "QR_CODE";
  const isLocationChallenge = challenge.submissionType === "LOCATION";
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
  const solvedGroupsCount =
    challengeSubmissions?.filter((submission) => submission.status === "APPROVED")
      .length ?? 0;
  const totalGroupsCount = trip?.groups?.length ?? 0;
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
      const submission = await locationSubmitMutation.mutateAsync({
        tripId,
        challengeId,
        latitude: currentDeviceCoords[1],
        longitude: currentDeviceCoords[0],
      });
      Alert.alert(
        "Location sent",
        submission.status === "APPROVED"
          ? "Location verified. Points granted."
          : "Location submission sent.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send location";
      Alert.alert("Location failed", message);
    }
  };

  const isVotingPhase = challenge.status === "VOTING_PHASE";
  const hasVotingWindow =
    Boolean(challenge.votingStartTime) && Boolean(challenge.votingEndTime);
  const isWithinVotingWindow =
    challenge.scoringCategory === "PEER_VOTING" &&
    hasVotingWindow &&
    isOnOrAfterNow(challenge.votingStartTime) &&
    isOnOrBeforeNow(challenge.votingEndTime);
  const shouldShowVotingTime =
    challenge.scoringCategory === "PEER_VOTING" &&
    (isVotingPhase || isWithinVotingWindow);
  const shouldShowSubmissionTime = !shouldShowVotingTime;
  const heroStatus =
    challenge.status !== "CANCELLED" && isWithinVotingWindow
      ? "VOTING_PHASE"
      : challenge.status;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl + 96 },
        ]}
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
          isRecurring={challenge.isRecurring}
          firstPlacePoints={challenge.firstPlacePoints}
          secondPlacePoints={challenge.secondPlacePoints}
          thirdPlacePoints={challenge.thirdPlacePoints}
        />

        {/* Description */}
        <ChallengeDescriptionCard
          description={challenge.description}
        />

        {shouldShowSubmissionTime ? (
          <ChallengeTimeLeftCard
            phaseLabel="Submission"
            isRecurring={challenge.isRecurring}
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
          <View style={styles.targetLocationCard}>
            <Text style={styles.targetLocationLabel}>Target location</Text>
            <View style={styles.targetLocationMapWrap}>
              <MapView mapStyle={MAP_STYLE} style={styles.targetLocationMap}>
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
                  <View style={styles.targetLocationMarker} />
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
            <Text style={styles.targetLocationCoords}>
              {Number(challenge.targetLatitude).toFixed(5)},{" "}
              {Number(challenge.targetLongitude).toFixed(5)}
            </Text>
          </View>
        ) : null}

        {shouldShowSolvedCounterOnly ? (
          <View style={styles.solvedCounterCard}>
            <Text style={styles.solvedCounterLabel}>Solved groups</Text>
            <Text style={styles.solvedCounterValue}>
              {solvedGroupsCount}/{totalGroupsCount}
            </Text>
          </View>
        ) : (
          <ChallengeCommunitySubmissionsCard
            submissions={challengeSubmissions ?? []}
            showPodium={challenge.scoringCategory !== "UNLIMITED"}
          />
        )}

        {isUploading && (
          <ChallengeUploadProgressCard progress={uploadProgress.percent} />
        )}

        {mySubmission && (
          <ExistingSubmissionCard
            submission={mySubmission}
            isWithdrawing={withdrawMutation.isPending}
            localPreviewUri={capturedImage}
            onWithdraw={handleWithdraw}
          />
        )}

        {isPeerVotingChallengeInVotingPhase && (
          <ChallengeActionButton
            isLoading={false}
            label="Vote"
            iconName="checkmark-circle"
            onPress={() =>
              router.push(`/trips/challenges/vote/${challenge.id}?tripId=${tripId}`)
            }
          />
        )}

        {/* Camera Button */}
        {!isPeerVotingChallengeInVotingPhase &&
          !mySubmission &&
          challenge.status !== "COMPLETED" && (
          <ChallengeActionButton
            isLoading={
              cameraLoading ||
              qrSubmitMutation.isPending ||
              locationSubmitMutation.isPending
            }
            label={
              isQrChallenge
                ? qrSubmitMutation.isPending
                  ? "Checking QR..."
                  : "Scan QR code"
                : isLocationChallenge
                  ? locationSubmitMutation.isPending
                    ? "Sending location..."
                    : "Send current location"
                : uploadLabel
            }
            onPress={async () => {
              if (isQrChallenge) {
                const permission =
                  cameraPermission?.granted
                    ? cameraPermission
                    : await requestCameraPermission();
                if (!permission?.granted) {
                  Alert.alert(
                    "Permission required",
                    "Camera permission is needed to scan QR code.",
                  );
                  return;
                }
                qrScanLockRef.current = false;
                setHasScannedQrThisSession(false);
                setIsQrScannerOpen(true);
                return;
              }
              if (isLocationChallenge) {
                await handleSendCurrentLocation();
                return;
              }
              void handleOpenCamera(
                challenge?.name,
                challenge?.basePoints ?? 0,
              );
            }}
          />
          )}
      </ScrollView>

      <Modal
        visible={isQrScannerOpen}
        animationType="slide"
        onRequestClose={() => setIsQrScannerOpen(false)}
      >
        <View style={styles.qrModalContainer}>
          <View
            style={[
              styles.qrModalHeader,
              { paddingTop: insets.top + spacing.md },
            ]}
          >
            <Text style={styles.qrModalTitle}>Scan QR code</Text>
            <TouchableOpacity
              onPress={() => {
                qrScanLockRef.current = false;
                setHasScannedQrThisSession(false);
                setIsQrScannerOpen(false);
              }}
              style={styles.qrModalCloseButton}
            >
              <Text style={styles.qrModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.qrCameraContainer}>
            <CameraView
              style={styles.qrCamera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={
                hasScannedQrThisSession
                  ? undefined
                  : async (event) => {
                if (
                  qrScanLockRef.current ||
                  hasScannedQrThisSession ||
                  !tripId ||
                  !challengeId
                ) {
                  return;
                }
                qrScanLockRef.current = true;
                setHasScannedQrThisSession(true);
                try {
                  const submission = await qrSubmitMutation.mutateAsync({
                    tripId,
                    challengeId,
                    textContent: event.data ?? "",
                  });
                  setIsQrScannerOpen(false);
                  Alert.alert(
                    "Challenge completed",
                    submission.status === "APPROVED"
                      ? "QR code valid. Points granted."
                      : "Submission sent.",
                  );
                } catch (error) {
                  setIsQrScannerOpen(false);
                  const message =
                    error instanceof Error ? error.message : "Invalid QR code";
                  Alert.alert("Invalid QR code", message);
                }
              }
              }
            />
          </View>
          <View style={styles.qrFooter}>
            <Text style={styles.qrFooterText}>
              Point camera at QR code to verify challenge.
            </Text>
          </View>
        </View>
      </Modal>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  solvedCounterCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  solvedCounterLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  solvedCounterValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  targetLocationCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  targetLocationLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  targetLocationMapWrap: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  targetLocationMap: {
    flex: 1,
  },
  targetLocationMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  targetLocationCoords: {
    color: colors.textSecondary,
    marginTop: 8,
    fontSize: 12,
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  qrModalHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qrModalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  qrModalCloseButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  qrModalCloseText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  qrCameraContainer: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  qrCamera: {
    flex: 1,
  },
  qrFooter: {
    padding: spacing.lg,
  },
  qrFooterText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
