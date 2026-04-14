import {
  ActivityIndicator,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { YStack, XStack, View } from "tamagui";
import { type Submission } from "~/stores/judgement";
import { useFileDownload } from "~/hooks/files";
import { Text, colorTokens } from "@mirai-app/ui";

const SubmissionAssetPreview = ({ submission }: { submission: Submission }) => {
  const { width, height } = useWindowDimensions();
  const hasImage = submission.imageIds.length > 0;
  const hasVideo = Boolean(submission.videoId);
  const videoContainerRef = useRef<View>(null);
  const [isVideoFullyVisible, setIsVideoFullyVisible] = useState(false);
  const [isFullscreenImageVisible, setIsFullscreenImageVisible] =
    useState(false);
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
    videoContainerRef.current.measureInWindow(
      (x, y, layoutWidth, layoutHeight) => {
        const fullyVisible =
          x >= 0 &&
          y >= 0 &&
          x + layoutWidth <= width &&
          y + layoutHeight <= height;
        setIsVideoFullyVisible(fullyVisible);
      },
    );
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
        <YStack
          flex={1}
          borderRadius="$md"
          overflow="hidden"
          backgroundColor={colorTokens.backgroundDarkAlt}
        >
          {imageStatus === "loading" ? (
            <YStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              backgroundColor={colorTokens.backgroundDarkAlt}
            >
              <ActivityIndicator size="small" color={colorTokens.primary} />
            </YStack>
          ) : imageFile?.uri ? (
            <Pressable onPress={openFullscreenImage}>
              <Image
                source={{ uri: imageFile.uri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <YStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              backgroundColor={colorTokens.backgroundDarkAlt}
            >
              <Ionicons
                name="image"
                size={36}
                color={colorTokens.textSecondary}
              />
              <Text variant="bodySmall" color="muted">
                Image unavailable
              </Text>
            </YStack>
          )}
          {submission.imageIds.length > 1 && (
            <XStack
              position="absolute"
              top="$sm"
              right="$sm"
              backgroundColor={colorTokens.blackOpacity40}
              paddingHorizontal="$sm"
              paddingVertical="$xs"
              borderRadius="$sm"
              alignItems="center"
              gap="$xs"
            >
              <Ionicons name="images" size={14} color={colorTokens.white} />
              <Text variant="caption" color="inverse" fontWeight="medium">
                {submission.imageIds.length}
              </Text>
            </XStack>
          )}
        </YStack>

        <Modal
          visible={isFullscreenImageVisible}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={closeFullscreenImage}
        >
          <YStack
            flex={1}
            backgroundColor={colorTokens.blackOpacity40}
            alignItems="center"
            justifyContent="center"
          >
            <Pressable
              style={{
                position: "absolute",
                top: 48,
                right: 24,
                padding: 8,
                backgroundColor: colorTokens.blackOpacity40,
                borderRadius: 9999,
                zIndex: 10,
              }}
              onPress={closeFullscreenImage}
            >
              <Ionicons name="close" size={24} color={colorTokens.white} />
            </Pressable>
            {imageFile?.uri ? (
              <Image
                source={{ uri: imageFile.uri }}
                style={{ width: "100%", height: "80%" }}
                contentFit="contain"
              />
            ) : (
              <YStack alignItems="center" justifyContent="center">
                <Ionicons
                  name="image"
                  size={36}
                  color={colorTokens.textSecondary}
                />
                <Text variant="bodySmall" color="muted">
                  Image unavailable
                </Text>
              </YStack>
            )}
          </YStack>
        </Modal>
      </>
    );
  }

  if (hasVideo) {
    return (
      <YStack
        ref={videoContainerRef}
        flex={1}
        borderRadius="$md"
        overflow="hidden"
        backgroundColor={colorTokens.backgroundDarkAlt}
        alignItems="center"
        justifyContent="center"
        onLayout={checkVideoVisibility}
      >
        {videoFile?.uri ? (
          <VideoView
            player={videoPlayer}
            style={{ width: "100%", height: "100%" }}
          />
        ) : videoStatus === "loading" ? (
          <ActivityIndicator size="small" color={colorTokens.white} />
        ) : (
          <Ionicons name="play-circle" size={48} color={colorTokens.white} />
        )}
        {!videoFile?.uri && (
          <Text variant="bodySmall" color="muted">
            {videoStatus === "loading" ? "Loading video" : "Video submission"}
          </Text>
        )}
      </YStack>
    );
  }

  return null;
};

export { SubmissionAssetPreview };
