import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/safeArea";
import { CapturedImageCard } from "~/components/trips/challenges/CapturedImageCard";
import { ChallengeActionButton } from "~/components/trips/challenges/ChallengeActionButton";
import { ChallengeDescriptionCard } from "~/components/trips/challenges/ChallengeDescriptionCard";
import { ChallengeHeroCard } from "~/components/trips/challenges/ChallengeHeroCard";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";
import { ChallengeDetailsCard } from "~/components/trips/challenges/ChallengeDetailsCard";
import { ChallengeUploadProgressCard } from "~/components/trips/challenges/ChallengeUploadProgressCard";
import { useChallengeDetails } from "~/hooks/challenges";
import { useChallengeCapture } from "~/hooks/challenges";

export default function ChallengeDetailScreen() {
  const router = useRouter();
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
    handleRetake,
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Icon & Status */}
        <ChallengeHeroCard
          name={challenge.name}
          points={challenge.basePoints ?? 0}
          isSelected={isAssignedToUser}
        />

        {/* Description */}
        <ChallengeDescriptionCard
          description={challenge.description}
          imageUrl={challenge.image}
        />

        <ChallengeDetailsCard challenge={challenge} />

        {isUploading && (
          <ChallengeUploadProgressCard progress={uploadProgress.percent} />
        )}

        {/* Captured Image */}
        {capturedImage && (
          <CapturedImageCard
            imageUri={capturedImage}
            onRetake={() => void handleRetake()}
            onDone={() => router.push(`/trips/challenges?tripId=${tripId}`)}
          />
        )}

        {/* Camera Button */}
        {!capturedImage && (
          <ChallengeActionButton
            isLoading={cameraLoading}
            label={uploadLabel}
            onPress={() =>
              void handleOpenCamera(
                challenge?.name,
                challenge?.basePoints ?? 0,
              )
            }
          />
        )}
      </ScrollView>
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
});
