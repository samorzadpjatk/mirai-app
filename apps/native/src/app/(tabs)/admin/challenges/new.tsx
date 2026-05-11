import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orpc } from "@mirai-app/orpc/client";
import { useMutation } from "@tanstack/react-query";
import { colors } from "~/styles";
import { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { ChallengeFormFields } from "~/components/admin/challenges/ChallengeFormFields";
import { ChallengeFormModals } from "~/components/admin/challenges/ChallengeFormModals";
import { formatIso, toOptionalInt, toVotingDurationHours } from "~/components/admin/challenges/challengeFormConstants";


export default function NewChallengeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const formState = useChallengeForm({
    tripId,
    isNewChallenge: true,
  });

  const { form, validateForm, isUploadingImage } = formState;

  const createChallengeMutation = useMutation(
    orpc.challenge.create.mutationOptions({
      onSuccess: () => {
        Alert.alert("Saved", "Challenge created successfully.", [
          {
            text: "OK",
            onPress: () => {
              router.replace({
                pathname: "/admin/challenges",
                params: { tripId },
              });
            },
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to create challenge: ${error.message}`);
      },
    }),
  );

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!tripId) {
      Alert.alert("Error", "No trip selected");
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

    try {
      await createChallengeMutation.mutateAsync({
        tripId,
        name: form.title.trim(),
        description: form.description.trim() || undefined,
        image: form.image || undefined,
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
        firstPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.firstPlacePoints)
          : undefined,
        secondPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.secondPlacePoints)
          : undefined,
        thirdPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.thirdPlacePoints)
          : undefined,
        status: form.status as "HIDDEN" | "VISIBLE",
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
        saveButtonText="Create Challenge"
        isSaving={createChallengeMutation.isPending}
        isNewChallenge={true}
      />
      <ChallengeFormModals formState={formState} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textSecondary,
  },
});
