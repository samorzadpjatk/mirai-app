import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useClient } from "urql";
import {
  CreateChallengeDocument,
  GetChallengesByTripDocument,
  type CreateChallengeInput,
} from "@mirai-app/graphql-types/urql";
import { colors } from "~/styles";
import { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { ChallengeFormFields } from "~/components/admin/challenges/ChallengeFormFields";
import { ChallengeFormModals } from "~/components/admin/challenges/ChallengeFormModals";
import {
  formatIso,
  toOptionalInt,
  toVotingDurationHours,
} from "~/components/admin/challenges/challengeFormConstants";

export default function NewChallengeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const client = useClient();

  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const formState = useChallengeForm({
    tripId,
    isNewChallenge: true,
  });

  const { form, validateForm, isUploadingImage } = formState;

  // GraphQL mutation for creating challenge using generated document
  const [, createChallenge] = useMutation(CreateChallengeDocument);

  const [isSaving, setIsSaving] = React.useState(false);

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

    setIsSaving(true);

    try {
      const result = await createChallenge({
        input: {
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
        } as CreateChallengeInput,
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate challenges query cache
      await client.invalidate(GetChallengesByTripDocument, {
        tripId,
        limit: 50,
        offset: 0,
      });

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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create challenge";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
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
        isSaving={isSaving}
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
