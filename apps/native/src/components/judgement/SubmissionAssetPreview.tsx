import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { useFileDownload } from "~/hooks/files";
import type { Submission } from "~/stores/judgement";
import { colors } from "~/styles";
import { textStyles, viewStyles } from "~/styles/judgement";

const SubmissionAssetPreview = ({ submission }: { submission: Submission }) => {
  const { width, height } = useWindowDimensions();
  const hasImage = submission.imageIds.length > 0;
  const hasVideo = Boolean(submission.videoId);
  const videoContainerRef = useRef<View>(null);
  const [isVideoFullyVisible, setIsVideoFullyVisible] = useState(false);
  const [isFullscreenImageVisible, setIsFullscreenImageVisible] = useState(false);
  const firstImageStoragePath = submission.imageIds[0] ?? null;
  const {
    download: downloadVideo,
    status: videoStatus,
    file: videoFile,
    reset: resetVideo,
    abort: abortVideo,
  } = useFileDownload();

  const videoPlayer = useVideoPlayer(
    videoFile?.uri ? { uri: videoFile.uri, useCaching: true } : null,
    (player) => {
      player.muted = true;
      player.loop = true;
    },
  );

  const checkVideoVisibility = useCallback(() => {
    if (!videoContainerRef.current) return;
    videoContainerRef.current.measureInWindow((x, y, layoutWidth, layoutHeight) => {
      const fullyVisible =
        x >= 0 && y >= 0 && x + layoutWidth <= width && y + layoutHeight <= height;
      setIsVideoFullyVisible(fullyVisible);
    });
  }, [height, width]);

  const openFullscreenImage = useCallback(() => {
    if (!firstImageStoragePath) return;
    setIsFullscreenImageVisible(true);
  }, [firstImageStoragePath]);

  const closeFullscreenImage = useCallback(() => {
    setIsFullscreenImageVisible(false);
  }, []);

  useEffect(() => {
    if (!hasVideo) {
      resetVideo();
      return;
    }

    resetVideo();
    void downloadVideo({
      storagePath: submission.videoId ?? "",
      skipCache: true,
    }).catch(() => {
      // Video may be temporarily unavailable; render fallback instead.
    });

    return () => {
      abortVideo();
    };
  }, [abortVideo, downloadVideo, hasVideo, resetVideo, submission.videoId]);

  useEffect(() => {
    if (!videoFile?.uri) return;
    checkVideoVisibility();
  }, [checkVideoVisibility, videoFile?.uri]);

  useEffect(() => {
    if (!videoFile?.uri) return;
    if (isVideoFullyVisible) {
      void videoPlayer.play();
    } else {
      void videoPlayer.pause();
    }
  }, [isVideoFullyVisible, videoFile?.uri, videoPlayer]);

  if (hasImage) {
    return (
      <>
        <View style={viewStyles.mediaWrapper}>
          <Pressable onPress={openFullscreenImage}>
            <CachedImage
              testID="submission-preview-image"
              storagePath={firstImageStoragePath ?? undefined}
              style={viewStyles.mediaImage}
              contentFit="cover"
              fallback={
                <View style={viewStyles.mediaLoading}>
                  <Ionicons name="image" size={36} color={colors.textSecondary} />
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
              style={viewStyles.fullscreenImage}
              contentFit="contain"
              fallback={
                <View style={viewStyles.mediaLoading}>
                  <Ionicons name="image" size={36} color={colors.textSecondary} />
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
      <View
        ref={videoContainerRef}
        style={[viewStyles.mediaWrapper, viewStyles.videoPlaceholder]}
        onLayout={checkVideoVisibility}
      >
        {videoFile?.uri ? (
          <VideoView player={videoPlayer} style={viewStyles.mediaImage} />
        ) : videoStatus === "loading" ? (
          <ActivityIndicator testID="video-loading" size="small" color={colors.white} />
        ) : (
          <Ionicons name="play-circle" size={48} color={colors.white} />
        )}
        {!videoFile?.uri && (
          <Text style={textStyles.videoLabel}>
            {videoStatus === "loading" ? "Loading video" : "Video submission"}
          </Text>
        )}
      </View>
    );
  }

  return null;
};

export { SubmissionAssetPreview };
