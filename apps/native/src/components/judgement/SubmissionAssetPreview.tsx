import { View, Text, ActivityIndicator, Modal, Pressable, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { colors } from "~/styles";
import { type Submission } from "~/stores/judgement";
import { useFileDownload } from "~/hooks/files";
import { viewStyles, textStyles } from "~/styles/judgement";

const SubmissionAssetPreview = ({ submission }: { submission: Submission }) => {
  const { width, height } = useWindowDimensions();
  const hasImage = submission.imageIds.length > 0;
  const hasVideo = Boolean(submission.videoId);
  const videoContainerRef = useRef<View>(null);
  const [isVideoFullyVisible, setIsVideoFullyVisible] = useState(false);
  const [isFullscreenImageVisible, setIsFullscreenImageVisible] = useState(false);
  const {
    download: downloadImage,
    status: imageStatus,
    file: imageFile,
    reset: resetImage,
    abort: abortImage,
  } = useFileDownload();
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

  useEffect(() => {
    if (!hasImage) {
      resetImage();
      return;
    }

    resetImage();
    void downloadImage({
      storagePath: submission.imageIds[0] ?? "",
      skipCache: true,
    }).catch(() => {
      // Submission metadata can arrive before the file is reachable in storage.
      // The UI already handles missing image with a fallback state.
    });

    return () => {
      abortImage();
    };
  }, [abortImage, downloadImage, hasImage, resetImage, submission.imageIds]);

  const openFullscreenImage = useCallback(() => {
    if (!imageFile?.uri) return;
    setIsFullscreenImageVisible(true);
  }, [imageFile?.uri]);

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
          {imageStatus === "loading" ? (
            <View style={viewStyles.mediaLoading}>
              <ActivityIndicator testID="image-loading" size="small" color={colors.primary} />
            </View>
          ) : imageFile?.uri ? (
            <Pressable onPress={openFullscreenImage}>
              <Image
                source={{ uri: imageFile.uri }}
                style={viewStyles.mediaImage}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <View style={viewStyles.mediaLoading}>
              <Ionicons name="image" size={36} color={colors.textSecondary} />
              <Text style={textStyles.videoLabel}>Image unavailable</Text>
            </View>
          )}
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
            {imageFile?.uri ? (
              <Image
                source={{ uri: imageFile.uri }}
                style={viewStyles.fullscreenImage}
                contentFit="contain"
              />
            ) : (
              <View style={viewStyles.mediaLoading}>
                <Ionicons name="image" size={36} color={colors.textSecondary} />
                <Text style={textStyles.videoLabel}>Image unavailable</Text>
              </View>
            )}
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
