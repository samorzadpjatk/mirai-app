import React from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeDocument,
  UpdateChallengeDocument,
  type Challenge,
  type UpdateChallengeInput,
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

// Type aliases for mutation input
interface FormattedUpdateInput {
  id: string;
  tripId: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  submissionType?:
    | "IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory?: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  isRecurring?: boolean;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  recurringDays?: number | null;
  basePoints?: number | null;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
  status?:
    | "HIDDEN"
    | "VISIBLE"
    | "ACTIVE"
    | "VOTING_PHASE"
    | "COMPLETED"
    | "CANCELLED";
  startTime?: string | null;
  endTime?: string | null;
  votingDurationHours?: number | null;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
  qrCodeValue?: string | null;
  textExpectedPhrase?: string | null;
  autoApprove?: boolean;
}

export default function EditChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const client = useClient();

  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");
  const challengeId =
    typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  // urql query for challenge details using generated document
  const [{ data: challengeData, fetching: isChallengeLoading }] = useQuery({
    query: GetChallengeDocument,
    variables: { id: challengeId, tripId },
    pause: !Boolean(challengeId) || !Boolean(tripId),
  });

  const challenge = challengeData?.challenge;

  const formState = useChallengeForm({
    tripId,
    isNewChallenge: false,
    challengeId,
  });

  const { form, validateForm, isUploadingImage, initializeFormFromChallenge } =
    formState;

  // Initialize form when challenge data is loaded
  if (challenge && formState.initializedChallengeId !== challenge.id) {
    initializeFormFromChallenge(challenge);
  }

  // urql mutation for updating challenge using generated document
  const [, updateChallenge] = useMutation(UpdateChallengeDocument);

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
      const formattedInput: FormattedUpdateInput = {
        id: challengeId,
        tripId,
        name: form.title.trim(),
        description: form.description.trim() || null,
        image: imageToPersist ?? null,
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
          ? formState.formatTime(form.dailyStartTime) || null
          : null,
        dailyEndTime: form.isRecurring
          ? formState.formatTime(form.dailyEndTime) || null
          : null,
        recurringDays: form.isRecurring
          ? toOptionalInt(form.recurringDays)
          : null,
        basePoints: toOptionalInt(form.basePoints),
        firstPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.firstPlacePoints)
          : null,
        secondPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.secondPlacePoints)
          : null,
        thirdPlacePoints: formState.showPodiumPoints
          ? toOptionalInt(form.thirdPlacePoints)
          : null,
        status: form.status as
          | "HIDDEN"
          | "VISIBLE"
          | "ACTIVE"
          | "VOTING_PHASE"
          | "COMPLETED"
          | "CANCELLED",
        startTime: !form.isRecurring ? formatIso(form.startTime) || null : null,
        endTime: !form.isRecurring ? formatIso(form.endTime) || null : null,
        votingDurationHours: formState.isPeerVoting
          ? toVotingDurationHours(
              form.votingDurationValue,
              form.votingDurationUnit,
            )
          : null,
        targetLatitude: normalizedTargetLatitude ?? null,
        targetLongitude: normalizedTargetLongitude ?? null,
        qrCodeValue:
          form.submissionType === "QR_CODE"
            ? form.qrCodeValue.trim() || null
            : null,
        textExpectedPhrase:
          form.submissionType === "TEXT"
            ? form.textExpectedPhrase.trim() || null
            : null,
        autoApprove: formState.isAutoApproveForced
          ? true
          : formState.isAutoApproveDisabled
            ? false
            : form.autoApprove,
      };

      const result = await updateChallenge({
        input: formattedInput as UpdateChallengeInput,
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate the challenge query cache
      await client.invalidate(GetChallengeDocument, {
        id: challengeId,
        tripId,
      });

      Alert.alert("Saved", "Challenge updated successfully.", [
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
      const message =
        error instanceof Error ? error.message : "Failed to update challenge";
      Alert.alert("Error", `Failed to update challenge: ${message}`);
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
        isSaving={false}
        isNewChallenge={false}
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
