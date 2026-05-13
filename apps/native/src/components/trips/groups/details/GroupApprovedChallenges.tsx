import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ApprovedSubmissionItem {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  imageStoragePath: string;
  approvedAt: string | Date;
}

interface GroupApprovedChallengesProps {
  submissions: ApprovedSubmissionItem[];
}

export function GroupApprovedChallenges({ submissions }: GroupApprovedChallengesProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<ApprovedSubmissionItem>>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openFullscreen = useCallback(
    (index: number) => {
      if (!submissions.length) return;
      setActiveIndex(index);
      setIsFullscreenOpen(true);
    },
    [submissions.length],
  );

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
  }, []);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / Math.max(width, 1));
      const boundedIndex = Math.max(0, Math.min(nextIndex, submissions.length - 1));
      setActiveIndex(boundedIndex);
    },
    [submissions.length, width],
  );

  useEffect(() => {
    if (submissions.length === 0) {
      setTimeout(() => setIsFullscreenOpen(false), 0);
      return;
    }
    if (!isFullscreenOpen) return;
    const boundedIndex = Math.max(0, Math.min(activeIndex, submissions.length - 1));
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: boundedIndex, animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreenOpen, activeIndex, submissions.length]);

  if (submissions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Challenge Photos</Text>
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => openFullscreen(0)}
          activeOpacity={0.8}
        >
          <Text style={styles.showAllButtonText}>View all</Text>
          <Ionicons name="expand-outline" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {submissions.map((submission, index) => (
          <SubmissionCircle
            key={submission.submissionId}
            submission={submission}
            onPress={() => openFullscreen(index)}
          />
        ))}
      </View>

      <Modal
        visible={isFullscreenOpen}
        animationType="slide"
        onRequestClose={closeFullscreen}
        presentationStyle="fullScreen"
      >
        <View style={styles.fullscreen}>
          <View style={[styles.fullscreenHeader, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.fullscreenTitle}>Challenge Photos</Text>
            <View style={styles.fullscreenHeaderRight}>
              <Text style={styles.fullscreenCounter}>
                {`${activeIndex + 1}/${submissions.length}`}
              </Text>
              <TouchableOpacity style={styles.fullscreenClose} onPress={closeFullscreen}>
                <Ionicons name="close" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={submissions}
            keyExtractor={(item) => item.submissionId}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const fallbackIndex = Math.max(
                0,
                Math.min(info.index, Math.max(submissions.length - 1, 0)),
              );
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: fallbackIndex,
                  animated: false,
                });
              }, 50);
            }}
            renderItem={({ item }) => (
              <FullscreenSubmissionSlide
                submission={item}
                width={width}
                height={height}
                topInset={insets.top}
              />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

function SubmissionCircle({
  submission,
  onPress,
}: {
  submission: ApprovedSubmissionItem;
  onPress: () => void;
}) {
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission.imageStoragePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageStoragePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, reset, submission.imageStoragePath]);

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrap}>
        {status === "loading" ? (
          <View style={styles.imageFallback}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : file?.uri ? (
          <Image source={{ uri: file.uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={18} color={colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {submission.challengeTitle}
      </Text>
    </TouchableOpacity>
  );
}

function FullscreenSubmissionSlide({
  submission,
  width,
  height,
  topInset,
}: {
  submission: ApprovedSubmissionItem;
  width: number;
  height: number;
  topInset: number;
}) {
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission.imageStoragePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageStoragePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, reset, submission.imageStoragePath]);

  return (
    <View style={[styles.fullscreenSlide, { width, minHeight: height - (topInset + 92) }]}>
      <View style={styles.fullscreenImageWrap}>
        {status === "loading" ? (
          <View style={styles.fullscreenFallback}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : file?.uri ? (
          <Image source={{ uri: file.uri }} style={styles.fullscreenImage} contentFit="contain" />
        ) : (
          <View style={styles.fullscreenFallback}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.fullscreenMeta}>
        <Text style={styles.fullscreenChallengeTitle} numberOfLines={1}>
          {submission.challengeTitle}
        </Text>
        <Text style={styles.fullscreenDate}>{formatDateTime(submission.approvedAt)}</Text>
      </View>
    </View>
  );
}

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  showAllButton: {
    borderWidth: 1,
    borderColor: "rgba(0,206,209,0.38)",
    backgroundColor: "rgba(0,206,209,0.12)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  showAllButtonText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  item: {
    width: "22%",
    alignItems: "center",
    gap: spacing.xs,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    color: colors.white,
    textAlign: "center",
    fontWeight: typography.medium,
    lineHeight: 14,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  fullscreenHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  fullscreenTitle: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  fullscreenHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fullscreenCounter: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  fullscreenClose: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  fullscreenSlide: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  fullscreenImageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    backgroundColor: colors.surfaceDark,
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  fullscreenFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenMeta: {
    marginTop: spacing.sm,
    gap: 2,
  },
  fullscreenChallengeTitle: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  fullscreenDate: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
});
