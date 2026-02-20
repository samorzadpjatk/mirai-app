import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface CommunitySubmission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ranking?: number | null;
  createdAt: string | Date;
  imageIds: string[];
  group: {
    id: string;
    name: string;
  };
}

interface ChallengeCommunitySubmissionsCardProps {
  submissions: CommunitySubmission[];
  showPodium: boolean;
}

const PREVIEW_LIMIT = 9;

const placeStyleMap: Record<number, { borderColor: string; label: string }> = {
  1: { borderColor: "#facc15", label: "1st Place" },
  2: { borderColor: "#cbd5e1", label: "2nd Place" },
  3: { borderColor: "#d97706", label: "3rd Place" },
};

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

export function ChallengeCommunitySubmissionsCard({
  submissions,
  showPodium,
}: ChallengeCommunitySubmissionsCardProps) {
  const insets = useAppSafeAreaInsets();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryListRef = useRef<FlatList<CommunitySubmission>>(null);
  const { width, height } = useWindowDimensions();

  const imageSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.status !== "REJECTED" && Boolean(submission.imageIds[0]),
      ),
    [submissions],
  );

  const podiumSubmissions = useMemo(() => {
    if (!showPodium) return [];
    return imageSubmissions
      .filter(
        (submission) =>
          submission.status === "APPROVED" &&
          typeof submission.ranking === "number" &&
          submission.ranking >= 1 &&
          submission.ranking <= 3,
      )
      .sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99));
  }, [imageSubmissions, showPodium]);

  const podiumByRank = useMemo(
    () =>
      new Map(
        podiumSubmissions.map((submission) => [
          submission.ranking!,
          submission,
        ]),
      ),
    [podiumSubmissions],
  );

  const regularSubmissions = useMemo(() => {
    if (!showPodium) return imageSubmissions;
    const podiumIds = new Set(
      podiumSubmissions.map((submission) => submission.id),
    );
    return imageSubmissions.filter(
      (submission) => !podiumIds.has(submission.id),
    );
  }, [imageSubmissions, podiumSubmissions, showPodium]);

  const previewRegularLimit = showPodium
    ? Math.max(0, PREVIEW_LIMIT - podiumSubmissions.length)
    : PREVIEW_LIMIT;
  const previewRegularSubmissions = regularSubmissions.slice(
    0,
    previewRegularLimit,
  );

  const gallerySubmissions = useMemo(
    () =>
      showPodium
        ? [...podiumSubmissions, ...regularSubmissions]
        : imageSubmissions,
    [imageSubmissions, podiumSubmissions, regularSubmissions, showPodium],
  );

  const galleryIndexBySubmissionId = useMemo(
    () =>
      new Map(
        gallerySubmissions.map((submission, index) => [submission.id, index]),
      ),
    [gallerySubmissions],
  );

  const hasAnySubmissions = imageSubmissions.length > 0;

  const openGalleryAt = useCallback(
    (submissionId?: string) => {
      if (!gallerySubmissions.length) return;
      const nextIndex = submissionId
        ? (galleryIndexBySubmissionId.get(submissionId) ?? 0)
        : 0;
      setActiveGalleryIndex(nextIndex);
      setIsGalleryOpen(true);
    },
    [galleryIndexBySubmissionId, gallerySubmissions.length],
  );

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  useEffect(() => {
    if (!isGalleryOpen || gallerySubmissions.length === 0) return;

    const boundedIndex = Math.max(
      0,
      Math.min(activeGalleryIndex, gallerySubmissions.length - 1),
    );
    const timeoutId = setTimeout(() => {
      galleryListRef.current?.scrollToIndex({
        index: boundedIndex,
        animated: false,
      });
    }, 30);

    return () => clearTimeout(timeoutId);
  }, [activeGalleryIndex, gallerySubmissions.length, isGalleryOpen]);

  const handleGalleryScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / Math.max(width, 1));
      const boundedIndex = Math.max(
        0,
        Math.min(nextIndex, Math.max(gallerySubmissions.length - 1, 0)),
      );
      if (boundedIndex !== activeGalleryIndex) {
        setActiveGalleryIndex(boundedIndex);
      }
    },
    [activeGalleryIndex, gallerySubmissions.length, width],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups submissions</Text>
        <Text style={styles.subtitle}>
          {hasAnySubmissions
            ? `${imageSubmissions.length} photos uploaded`
            : "No photos yet. Your group can be first."}
        </Text>
      </View>

      {!hasAnySubmissions ? (
        <View style={styles.emptyGallery}>
          <Ionicons name="images-outline" size={20} color={colors.textMuted} />
          <Text style={styles.emptyGalleryText}>
            No photos yet. Submit first and set the pace.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {showPodium && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top 3</Text>
              <View style={styles.podiumRow}>
                {[1, 2, 3].map((rank) => {
                  const submission = podiumByRank.get(rank);
                  if (!submission) {
                    return (
                      <PodiumPlaceholder key={`podium-${rank}`} rank={rank} />
                    );
                  }

                  return (
                    <SubmissionTile
                      key={`podium-${submission.id}`}
                      submission={submission}
                      mode="podium"
                      rank={rank}
                      onPress={() => openGalleryAt(submission.id)}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {previewRegularSubmissions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {showPodium ? "More photos" : "Gallery"}
              </Text>
              <View style={styles.previewGrid}>
                {previewRegularSubmissions.map((submission) => (
                  <SubmissionTile
                    key={`preview-${submission.id}`}
                    submission={submission}
                    mode="preview"
                    onPress={() => openGalleryAt(submission.id)}
                  />
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.showAllButton}
            onPress={() => openGalleryAt()}
          >
            <Text style={styles.showAllText}>View all ({imageSubmissions.length})</Text>
            <Ionicons
              name="arrow-forward-circle-outline"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isGalleryOpen}
        animationType="slide"
        onRequestClose={closeGallery}
        presentationStyle="fullScreen"
      >
        <View style={styles.fullscreen}>
          <View
            style={[
              styles.fullscreenHeader,
              { paddingTop: insets.top + spacing.sm },
            ]}
          >
            <Text style={styles.fullscreenTitle}>Groups submissions</Text>
            <View style={styles.fullscreenHeaderRight}>
              <Text style={styles.fullscreenCounter}>
                {gallerySubmissions.length > 0
                  ? `${activeGalleryIndex + 1}/${gallerySubmissions.length}`
                  : "0/0"}
              </Text>
              <TouchableOpacity style={styles.fullscreenClose} onPress={closeGallery}>
                <Ionicons name="close" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={galleryListRef}
            data={gallerySubmissions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleGalleryScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const fallbackIndex = Math.max(
                0,
                Math.min(info.index, Math.max(gallerySubmissions.length - 1, 0)),
              );
              setTimeout(() => {
                galleryListRef.current?.scrollToIndex({
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

function PodiumPlaceholder({ rank }: { rank: number }) {
  return (
    <View style={styles.podiumPlaceholder}>
      <View style={styles.podiumPlaceholderImage}>
        <Ionicons name="trophy-outline" size={14} color={colors.textMuted} />
      </View>
      <Text style={styles.podiumPlaceholderText}>#{rank}</Text>
    </View>
  );
}

function SubmissionTile({
  submission,
  mode,
  rank,
  onPress,
}: {
  submission: CommunitySubmission;
  mode: "podium" | "preview";
  rank?: number;
  onPress: () => void;
}) {
  const imagePath = submission.imageIds[0] ?? "";
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!imagePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: imagePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, imagePath, reset]);

  const placeStyle = rank ? placeStyleMap[rank] : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.tile,
        mode === "podium" ? styles.podiumTile : styles.previewTile,
        placeStyle ? { borderColor: placeStyle.borderColor } : undefined,
      ]}
    >
      <View style={styles.tileImageWrap}>
        {status === "loading" ? (
          <View style={styles.tileFallback}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : file?.uri ? (
          <Image
            source={{ uri: file.uri }}
            style={styles.tileImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.tileFallback}>
            <Ionicons name="image-outline" size={16} color={colors.textMuted} />
          </View>
        )}
      </View>

      {mode === "podium" && (
        <Text style={styles.podiumTileLabel} numberOfLines={1}>
          {placeStyle?.label ?? submission.group.name}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function FullscreenSubmissionSlide({
  submission,
  width,
  height,
  topInset,
}: {
  submission: CommunitySubmission;
  width: number;
  height: number;
  topInset: number;
}) {
  const imagePath = submission.imageIds[0] ?? "";
  const { download, status, file, reset, abort } = useFileDownload();
  const placeStyle =
    typeof submission.ranking === "number"
      ? placeStyleMap[submission.ranking]
      : undefined;

  useEffect(() => {
    if (!imagePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: imagePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, imagePath, reset]);

  return (
    <View
      style={[
        styles.fullscreenSlide,
        { width, minHeight: height - (topInset + 92) },
      ]}
    >
      <View style={styles.fullscreenImageWrap}>
        {status === "loading" ? (
          <View style={styles.fullscreenFallback}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : file?.uri ? (
          <Image
            source={{ uri: file.uri }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.fullscreenFallback}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.fullscreenMeta}>
        <Text style={styles.fullscreenGroupName} numberOfLines={1}>
          {submission.group.name}
        </Text>
        {placeStyle ? (
          <Text
            style={[styles.fullscreenRankLabel, { color: placeStyle.borderColor }]}
          >
            {placeStyle.label}
          </Text>
        ) : null}
        <Text style={styles.fullscreenDate}>{formatDateTime(submission.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: typography.bold,
  },
  podiumRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDark,
    overflow: "hidden",
  },
  podiumTile: {
    flex: 1,
    padding: 6,
    gap: 6,
  },
  previewTile: {
    width: "31.5%",
    padding: 4,
  },
  tileImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: colors.cardDark,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  tileFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumTileLabel: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.bold,
  },
  podiumPlaceholder: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDark,
    padding: 6,
    gap: 6,
    alignItems: "center",
  },
  podiumPlaceholderImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardDark,
  },
  podiumPlaceholderText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.bold,
  },
  emptyGallery: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderStyle: "dashed",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyGalleryText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    flex: 1,
  },
  showAllButton: {
    borderWidth: 1,
    borderColor: "rgba(0,206,209,0.4)",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(0,206,209,0.12)",
  },
  showAllText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  fullscreenHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  fullscreenTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  fullscreenHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fullscreenCounter: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  fullscreenClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenSlide: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  fullscreenImageWrap: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    backgroundColor: "#090a0d",
    minHeight: 300,
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
    paddingHorizontal: spacing.xs,
  },
  fullscreenGroupName: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  fullscreenRankLabel: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fullscreenDate: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
});
