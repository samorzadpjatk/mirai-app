import { orpc } from "@mirai-app/orpc/client";
import { invalidateChallengeQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, View } from "react-native";
import LoadingScreen from "~/components/LoadingScreen";
import { ChallengeFormFields } from "~/components/admin/challenges/ChallengeFormFields";
import { ChallengeFormModals } from "~/components/admin/challenges/ChallengeFormModals";
import {
  formatIso,
  toOptionalInt,
  toVotingDurationHours,
} from "~/components/admin/challenges/challengeFormConstants";
import { DeckBackground } from "~/components/common/DeckBackground";
import { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { colors } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

export default function EditChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const styles = useThemedStyles(makeStyles);

  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");
  const challengeId = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const challengeQueryOptions = orpc.challenge.getById.queryOptions({
    input: {
      id: challengeId,
      tripId,
    },
  });

  const { data: challenge, isLoading: isChallengeLoading } = useQuery({
    ...challengeQueryOptions,
    enabled: Boolean(challengeId) && Boolean(tripId),
    // The client defaults to `refetchOnMount: false`, which is wrong for an editor:
    // it would hydrate the form from whatever the cache last saw and then post that
    // back on save, overwriting anything changed since.
    refetchOnMount: "always",
    staleTime: 0,
  });

  const formState = useChallengeForm({
    tripId,
    isNewChallenge: false,
    challengeId,
  });

  const { form, validateForm, isUploadingImage, initializeFormFromChallenge } = formState;

  // Initialize form when challenge data is loaded
  if (challenge && formState.initializedChallengeId !== challenge.id) {
    initializeFormFromChallenge(challenge);
  }

  const updateChallengeMutation = useMutation(
    orpc.challenge.update.mutationOptions({
      onSuccess: async () => {
        // Invalidate the lists too, not just this one challenge: they are infinite
        // queries under a different key shape and would otherwise keep showing the
        // pre-edit row.
        await invalidateChallengeQueries(queryClient);
        Alert.alert("Saved", "Challenge updated successfully.", [
          {
            text: "OK",
            onPress: () => {
              void queryClient.invalidateQueries({ queryKey: challengeQueryOptions.queryKey });
              router.replace({
                pathname: "/admin/challenges",
                params: { tripId },
              });
            },
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update challenge: ${error.message}`);
      },
    }),
  );

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!tripId) {
      Alert.alert("Error", "No trip selected");
      return;
    }
    if (!challengeId) {
      Alert.alert("Error", "Missing challenge id");
      return;
    }

    if (isUploadingImage) {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    const normalizedTargetLatitude = formState.needsLocation
      ? form.targetLocation?.latitude
      : undefined;
    const normalizedTargetLongitude = formState.needsLocation
      ? form.targetLocation?.longitude
      : undefined;

    if (
      formState.needsLocation &&
      (normalizedTargetLatitude == null || normalizedTargetLongitude == null)
    ) {
      Alert.alert("Error", "Please select a valid location on the map.");
      return;
    }

    // Only send the status when the admin actually moved it. The form carries every
    // field, so replaying an untouched status would undo a lifecycle change made
    // elsewhere -- or one made a moment earlier from this very screen.
    const statusToPersist =
      form.status !== formState.initialStatus
        ? (form.status as
            | "HIDDEN"
            | "VISIBLE"
            | "ACTIVE"
            | "VOTING_PHASE"
            | "COMPLETED"
            | "CANCELLED")
        : undefined;

    const normalizedImage = form.image.trim();
    const imageToPersist =
      normalizedImage.length > 0 && normalizedImage !== formState.initialImage
        ? normalizedImage
        : undefined;

    try {
      await updateChallengeMutation.mutateAsync({
        id: challengeId,
        tripId,
        name: form.title.trim(),
        description: form.description.trim() || undefined,
        image: imageToPersist,
        submissionType: form.submissionType as
          | "IMAGE"
          | "VIDEO"
          | "TEXT"
          | "IMAGE_LOCATION"
          | "LOCATION"
          | "QR_CODE",
        scoringCategory: form.scoringCategory as
          | "SPEED"
          | "UNLIMITED"
          | "JUDGED_STAFF"
          | "PEER_VOTING",
        isRecurring: form.isRecurring,
        dailyStartTime: form.isRecurring
          ? formState.formatTime(form.dailyStartTime) || undefined
          : undefined,
        dailyEndTime: form.isRecurring
          ? formState.formatTime(form.dailyEndTime) || undefined
          : undefined,
        recurringDays: form.isRecurring ? toOptionalInt(form.recurringDays) : undefined,
        basePoints: toOptionalInt(form.basePoints),
        firstPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.firstPlacePoints)
          : undefined,
        secondPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.secondPlacePoints)
          : undefined,
        thirdPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.thirdPlacePoints)
          : undefined,
        status: statusToPersist,
        startTime: form.isRecurring ? undefined : formatIso(form.startTime) || undefined,
        endTime: form.isRecurring ? undefined : formatIso(form.endTime) || undefined,
        votingDurationHours: formState.isPeerVoting
          ? toVotingDurationHours(form.votingDurationValue, form.votingDurationUnit)
          : undefined,
        targetLatitude: normalizedTargetLatitude,
        targetLongitude: normalizedTargetLongitude,
        qrCodeValue:
          form.submissionType === "QR_CODE" ? form.qrCodeValue.trim() || undefined : undefined,
        textExpectedPhrase:
          form.submissionType === "TEXT" ? form.textExpectedPhrase.trim() || undefined : undefined,
        autoApprove: formState.isAutoApproveForced
          ? true
          : formState.isAutoApproveDisabled
            ? false
            : form.autoApprove,
      });
    } catch {
      // onError already handles user-facing message; swallow to prevent unhandled rejections.
    }
  };

  if (isChallengeLoading) {
    return <LoadingScreen message="Loading challenge..." />;
  }

  if (!tripId) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingText}>Missing trip context.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <DeckBackground />
      <ChallengeFormFields
        formState={formState}
        onSave={handleSave}
        saveButtonText="Update Challenge"
        isSaving={updateChallengeMutation.isPending}
        isNewChallenge={false}
      />
      <ChallengeFormModals formState={formState} />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    missingContainer: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
      justifyContent: "center",
      alignItems: "center",
    },
    missingText: {
      color: palette.textSecondary,
    },
  });
}
