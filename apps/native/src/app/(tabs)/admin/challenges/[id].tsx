import React from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { colors } from "~/styles";
import { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { ChallengeFormFields } from "~/components/admin/challenges/ChallengeFormFields";
import { ChallengeFormModals } from "~/components/admin/challenges/ChallengeFormModals";
import { formatIso, toOptionalInt, toVotingDurationHours } from "~/components/admin/challenges/challengeFormConstants";


export default function EditChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");
  const challengeId =
    typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const challengeQueryOptions = orpc.challenge.getById.queryOptions({
    input: {
      id: challengeId,
      tripId,
    },
  });

  const { data: challenge, isLoading: isChallengeLoading } = useQuery({
    ...challengeQueryOptions,
    enabled: Boolean(challengeId) && Boolean(tripId),
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
      onSuccess: () => {
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
        recurringDays: form.isRecurring
          ? toOptionalInt(form.recurringDays)
          : undefined,
        basePoints: toOptionalInt(form.basePoints),
        firstPlacePoints:
          formState.showPodiumPoints
            ? toOptionalInt(form.firstPlacePoints)
            : undefined,
        secondPlacePoints:
          formState.showPodiumPoints
            ? toOptionalInt(form.secondPlacePoints)
            : undefined,
        thirdPlacePoints:
          formState.showPodiumPoints
            ? toOptionalInt(form.thirdPlacePoints)
            : undefined,
        status: form.status as
          | "HIDDEN"
          | "VISIBLE"
          | "ACTIVE"
          | "VOTING_PHASE"
          | "COMPLETED"
          | "CANCELLED",
        startTime: !form.isRecurring
          ? formatIso(form.startTime) || undefined
          : undefined,
        endTime: !form.isRecurring
          ? formatIso(form.endTime) || undefined
          : undefined,
        votingDurationHours: formState.isPeerVoting
          ? toVotingDurationHours(
              form.votingDurationValue,
              form.votingDurationUnit,
            )
          : undefined,
        targetLatitude: normalizedTargetLatitude,
        targetLongitude: normalizedTargetLongitude,
        qrCodeValue:
          form.submissionType === "QR_CODE"
            ? form.qrCodeValue.trim() || undefined
            : undefined,
        textExpectedPhrase:
          form.submissionType === "TEXT"
            ? form.textExpectedPhrase.trim() || undefined
            : undefined,
        autoApprove:
          formState.isAutoApproveForced
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  missingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  missingText: {
    color: colors.textSecondary,
  },
});
