import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useFileDownload } from "~/hooks/files";
import { colors, spacing, typography } from "~/styles";

export interface SubmissionVideoPlayerProps {
  /** Storage path of the submitted video, as returned by the submission routers. */
  storagePath?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  /** Size of the placeholder play icon shown before the video is downloaded. */
  placeholderIconSize?: number;
}

/**
 * Downloads and plays a submitted video. Playback is paused while the player is not
 * fully on screen so several cards can share the screen without fighting over audio.
 *
 * Extracted from SubmissionAssetPreview so that the voting decks can render video
 * submissions instead of silently dropping them.
 */
export function SubmissionVideoPlayer({
  storagePath,
  containerStyle,
  videoStyle,
  labelStyle,
  placeholderIconSize = 48,
}: SubmissionVideoPlayerProps) {
  const { width, height } = useWindowDimensions();
  const containerRef = useRef<View>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);
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

  const checkVisibility = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.measureInWindow((x, y, layoutWidth, layoutHeight) => {
      setIsFullyVisible(x >= 0 && y >= 0 && x + layoutWidth <= width && y + layoutHeight <= height);
    });
  }, [height, width]);

  useEffect(() => {
    if (!storagePath) {
      resetVideo();
      return;
    }

    resetVideo();
    void downloadVideo({ storagePath, skipCache: true }).catch(() => {
      // Video may be temporarily unavailable; render the fallback instead.
    });

    return () => {
      abortVideo();
    };
  }, [abortVideo, downloadVideo, resetVideo, storagePath]);

  useEffect(() => {
    if (!videoFile?.uri) return;
    checkVisibility();
  }, [checkVisibility, videoFile?.uri]);

  useEffect(() => {
    if (!videoFile?.uri) return;
    if (isFullyVisible) {
      void videoPlayer.play();
    } else {
      void videoPlayer.pause();
    }
  }, [isFullyVisible, videoFile?.uri, videoPlayer]);

  if (!storagePath) return null;

  return (
    <View
      ref={containerRef}
      style={[styles.container, containerStyle]}
      onLayout={checkVisibility}
      testID="submission-video-player"
    >
      {videoFile?.uri ? (
        <VideoView player={videoPlayer} style={[styles.video, videoStyle]} />
      ) : videoStatus === "loading" ? (
        <ActivityIndicator testID="video-loading" size="small" color={colors.white} />
      ) : (
        <Ionicons name="play-circle" size={placeholderIconSize} color={colors.white} />
      )}
      {!videoFile?.uri && (
        <Text style={[styles.label, labelStyle]}>
          {videoStatus === "loading" ? "Loading video" : "Video submission"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  label: {
    color: colors.white,
    fontSize: typography.sm,
    marginTop: spacing.sm,
  },
});
