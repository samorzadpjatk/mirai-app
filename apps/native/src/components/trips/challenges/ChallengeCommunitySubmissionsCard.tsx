import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CachedImage } from "~/components/common/CachedImage";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import { formatDate } from "~/utils/format";

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

export function filterImageSubmissions(submissions: CommunitySubmission[]): CommunitySubmission[] {
  return submissions.filter(
    (submission) => submission.status === "APPROVED" && Boolean(submission.imageIds[0]),
  );
}

export function getPodiumSubmissions(
  imageSubmissions: CommunitySubmission[],
  showPodium: boolean,
): CommunitySubmission[] {
  if (!showPodium) return [];
  return imageSubmissions
    .filter(
      (submission) =>
        typeof submission.ranking === "number" &&
        submission.ranking >= 1 &&
        submission.ranking <= 3,
    )
    .sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99));
}

export function getRegularSubmissions(
  imageSubmissions: CommunitySubmission[],
  podiumSubmissions: CommunitySubmission[],
  showPodium: boolean,
): CommunitySubmission[] {
  if (!showPodium) return imageSubmissions;
  const podiumIds = new Set(podiumSubmissions.map((submission) => submission.id));
  return imageSubmissions.filter((submission) => !podiumIds.has(submission.id));
}

export function calculatePreviewRegularLimit(
  showPodium: boolean,
  podiumSubmissionsLength: number,
): number {
  return showPodium ? Math.max(0, PREVIEW_LIMIT - podiumSubmissionsLength) : PREVIEW_LIMIT;
}

export function buildGallerySubmissions(
  showPodium: boolean,
  podiumSubmissions: CommunitySubmission[],
  regularSubmissions: CommunitySubmission[],
  imageSubmissions: CommunitySubmission[],
): CommunitySubmission[] {
  return showPodium ? [...podiumSubmissions, ...regularSubmissions] : imageSubmissions;
}

export function buildGalleryIndexBySubmissionId(
  gallerySubmissions: CommunitySubmission[],
): Map<string, number> {
  return new Map(gallerySubmissions.map((submission, index) => [submission.id, index]));
}

export function ChallengeCommunitySubmissionsCard({
  submissions,
  showPodium,
}: ChallengeCommunitySubmissionsCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const insets = useSafeAreaInsets();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryListRef = useRef<FlatList<CommunitySubmission>>(null);
  const { width, height } = useWindowDimensions();

  const imageSubmissions = useMemo(() => filterImageSubmissions(submissions), [submissions]);

  const podiumSubmissions = useMemo(
    () => getPodiumSubmissions(imageSubmissions, showPodium),
    [imageSubmissions, showPodium],
  );

  const podiumByRank = useMemo(
    () =>
      new Map(
        podiumSubmissions.flatMap((submission) =>
          submission.ranking != null ? [[submission.ranking, submission] as const] : [],
        ),
      ),
    [podiumSubmissions],
  );

  const regularSubmissions = useMemo(
    () => getRegularSubmissions(imageSubmissions, podiumSubmissions, showPodium),
    [imageSubmissions, podiumSubmissions, showPodium],
  );

  const previewRegularLimit = calculatePreviewRegularLimit(showPodium, podiumSubmissions.length);
  const previewRegularSubmissions = regularSubmissions.slice(0, previewRegularLimit);

  const gallerySubmissions = useMemo(
    () =>
      buildGallerySubmissions(showPodium, podiumSubmissions, regularSubmissions, imageSubmissions),
    [imageSubmissions, podiumSubmissions, regularSubmissions, showPodium],
  );

  const galleryIndexBySubmissionId = useMemo(
    () => buildGalleryIndexBySubmissionId(gallerySubmissions),
    [gallerySubmissions],
  );

  const hasAnySubmissions = imageSubmissions.length > 0;

  const openGalleryAt = useCallback(
    (submissionId?: string) => {
      if (!gallerySubmissions.length) return;
      const nextIndex = submissionId ? (galleryIndexBySubmissionId.get(submissionId) ?? 0) : 0;
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

    const boundedIndex = Math.max(0, Math.min(activeGalleryIndex, gallerySubmissions.length - 1));
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
      <WoodTexture radius={borderRadius.xl} />
      <View style={styles.header}>
        <Text style={styles.title}>Groups submissions</Text>
        <Text style={styles.subtitle}>
          {hasAnySubmissions
            ? `${imageSubmissions.length} photos uploaded`
            : "No photos yet. Your group can be first."}
        </Text>
      </View>

      {hasAnySubmissions ? (
        <View style={styles.content}>
          {showPodium && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top 3</Text>
              <View style={styles.podiumRow}>
                {[1, 2, 3].map((rank) => {
                  const submission = podiumByRank.get(rank);
                  if (!submission) {
                    return <PodiumPlaceholder key={`podium-${rank}`} rank={rank} />;
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
              <Text style={styles.sectionTitle}>{showPodium ? "More photos" : "Gallery"}</Text>
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

          <TouchableOpacity style={styles.showAllButton} onPress={() => openGalleryAt()}>
            <Text style={styles.showAllText}>View all ({imageSubmissions.length})</Text>
            <Ionicons name="arrow-forward-circle-outline" size={16} color={palette.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyGallery}>
          <Ionicons name="images-outline" size={20} color={colors.textMuted} />
          <Text style={styles.emptyGalleryText}>No photos yet. Submit first and set the pace.</Text>
        </View>
      )}

      <Modal
        visible={isGalleryOpen}
        animationType="slide"
        onRequestClose={closeGallery}
        presentationStyle="fullScreen"
      >
        <View style={styles.fullscreen}>
          <View style={[styles.fullscreenHeader, { paddingTop: insets.top + spacing.sm }]}>
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

          {/* ListEmptyComponent not needed: gallery modal is guarded by `openGalleryAt`
              which checks `if (!gallerySubmissions.length) return;` before opening.
              The FlatList only renders when there are gallery submissions to display. */}
          <FlatList
            ref={galleryListRef}
            data={gallerySubmissions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
            horizontal={true}
            pagingEnabled={true}
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
  const styles = useThemedStyles(makeStyles);
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
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const imagePath = submission.imageIds[0] ?? "";
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
        <CachedImage
          storagePath={imagePath}
          style={styles.tileImage}
          contentFit="contain"
          fallback={
            <View style={styles.tileFallback}>
              <ActivityIndicator size="small" color={palette.primary} />
            </View>
          }
        />
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
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const imagePath = submission.imageIds[0] ?? "";
  const placeStyle =
    typeof submission.ranking === "number" ? placeStyleMap[submission.ranking] : undefined;

  return (
    <View style={[styles.fullscreenSlide, { width, minHeight: height - (topInset + 92) }]}>
      <View style={styles.fullscreenImageWrap}>
        <CachedImage
          storagePath={imagePath}
          style={styles.fullscreenImage}
          contentFit="contain"
          fallback={
            <View style={styles.fullscreenFallback}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          }
        />
      </View>

      <View style={styles.fullscreenMeta}>
        <Text style={styles.fullscreenGroupName} numberOfLines={1}>
          {submission.group.name}
        </Text>
        {placeStyle ? (
          <Text style={[styles.fullscreenRankLabel, { color: placeStyle.borderColor }]}>
            {placeStyle.label}
          </Text>
        ) : null}
        <Text style={styles.fullscreenDate}>{formatDate(submission.createdAt)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: palette.cardDark,
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
      backgroundColor: palette.surfaceDark,
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
      backgroundColor: palette.cardDark,
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
      backgroundColor: palette.surfaceDark,
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
      backgroundColor: palette.cardDark,
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
      color: palette.primary,
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
