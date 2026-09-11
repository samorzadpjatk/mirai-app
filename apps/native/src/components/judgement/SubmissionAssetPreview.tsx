import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { SubmissionVideoPlayer } from "~/components/common/SubmissionVideoPlayer";
import type { Submission } from "~/stores/judgement";
import { colors } from "~/styles";
import { makeJudgementTextStyles, makeJudgementViewStyles } from "~/styles/judgement";
import { useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

const SubmissionAssetPreview = ({ submission }: { submission: Submission }) => {
  const viewStyles = useThemedStyles(makeJudgementViewStyles);
  const textStyles = useThemedStyles(makeJudgementTextStyles);
  const { palette } = useTripTheme();
  const hasImage = submission.imageIds.length > 0;
  const hasVideo = Boolean(submission.videoId);
  const [isFullscreenImageVisible, setIsFullscreenImageVisible] = useState(false);
  const firstImageStoragePath = submission.imageIds[0] ?? null;

  const openFullscreenImage = useCallback(() => {
    if (!firstImageStoragePath) return;
    setIsFullscreenImageVisible(true);
  }, [firstImageStoragePath]);

  const closeFullscreenImage = useCallback(() => {
    setIsFullscreenImageVisible(false);
  }, []);

  if (hasImage) {
    return (
      <>
        <View style={viewStyles.mediaWrapper}>
          <Pressable onPress={openFullscreenImage}>
            <CachedImage
              testID="submission-preview-image"
              storagePath={firstImageStoragePath ?? undefined}
              transform="feedCard"
              style={viewStyles.mediaImage}
              contentFit="cover"
              fallback={
                <View style={viewStyles.mediaLoading}>
                  <Ionicons name="image" size={36} color={palette.textSecondary} />
                  <Text style={textStyles.videoLabel}>Image unavailable</Text>
                </View>
              }
            />
          </Pressable>
          {submission.imageIds.length > 1 && (
            <View style={viewStyles.mediaBadge}>
              <Ionicons name="images" size={14} color={colors.white} />
              <Text style={textStyles.mediaBadgeText}>{submission.imageIds.length}</Text>
            </View>
          )}
        </View>

        <Modal
          visible={isFullscreenImageVisible}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={closeFullscreenImage}
        >
          <View style={viewStyles.fullscreenImageContainer}>
            <Pressable style={viewStyles.fullscreenImageClose} onPress={closeFullscreenImage}>
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
            <CachedImage
              testID="fullscreen-image"
              storagePath={firstImageStoragePath ?? undefined}
              transform="feedCard"
              style={viewStyles.fullscreenImage}
              contentFit="contain"
              fallback={
                <View style={viewStyles.mediaLoading}>
                  <Ionicons name="image" size={36} color={palette.textSecondary} />
                  <Text style={textStyles.videoLabel}>Image unavailable</Text>
                </View>
              }
            />
          </View>
        </Modal>
      </>
    );
  }

  if (hasVideo) {
    return (
      <SubmissionVideoPlayer
        storagePath={submission.videoId}
        containerStyle={[viewStyles.mediaWrapper, viewStyles.videoPlaceholder]}
        videoStyle={viewStyles.mediaImage}
        labelStyle={textStyles.videoLabel}
      />
    );
  }

  return null;
};

export { SubmissionAssetPreview };
