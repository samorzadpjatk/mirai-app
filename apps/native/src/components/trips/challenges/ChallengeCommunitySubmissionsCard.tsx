import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
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

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

const placeStyleMap: Record<number, { borderColor: string; label: string }> = {
  1: { borderColor: "#facc15", label: "1st Place" },
  2: { borderColor: "#cbd5e1", label: "2nd Place" },
  3: { borderColor: "#d97706", label: "3rd Place" },
};

export function ChallengeCommunitySubmissionsCard({
  submissions,
  showPodium,
}: ChallengeCommunitySubmissionsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const filteredSubmissions = submissions;

  const podiumSubmissions = useMemo(() => {
    if (!showPodium) return [];
    return filteredSubmissions
      .filter(
        (submission) =>
          submission.status === "APPROVED" &&
          typeof submission.ranking === "number" &&
          submission.ranking >= 1 &&
          submission.ranking <= 3,
      )
      .sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99));
  }, [filteredSubmissions, showPodium]);
  const podiumByRank = useMemo(
    () =>
      new Map(
        podiumSubmissions.map((submission) => [submission.ranking!, submission]),
      ),
    [podiumSubmissions],
  );

  const regularSubmissions = useMemo(
    () =>
      filteredSubmissions.filter((submission) => {
        if (!showPodium) return true;
        return !(
          typeof submission.ranking === "number" &&
          submission.ranking >= 1 &&
          submission.ranking <= 3
        );
      }),
    [filteredSubmissions, showPodium],
  );
  const hasAnySubmissions = filteredSubmissions.length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((current) => !current)}
      >
        <View>
          <Text style={styles.title}>Groups submissions</Text>
          <Text style={styles.subtitle}>
            {hasAnySubmissions
              ? `${filteredSubmissions.length} groups shared submissions`
              : "No submissions yet. Your group can be first."}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {!expanded && showPodium && (
        <View style={styles.podiumPreviewRow}>
          {[1, 2, 3].map((rank) => (
            <PodiumPreviewTile
              key={`podium-preview-${rank}`}
              rank={rank}
              submission={podiumByRank.get(rank)}
              onOpenPreview={(uri) => {
                const submission = podiumByRank.get(rank);
                if (!submission) return;
                setPreviewUri(uri);
                setPreviewTitle(submission.group.name);
              }}
            />
          ))}
        </View>
      )}

      {expanded && (
        <View style={styles.body}>
          {showPodium && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Podium</Text>
              {podiumSubmissions.length > 0 ? (
                podiumSubmissions.map((submission) => (
                  <CommunitySubmissionRow
                    key={submission.id}
                    submission={submission}
                    onOpenPreview={(uri) => {
                      setPreviewUri(uri);
                      setPreviewTitle(submission.group.name);
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyRowText}>1st place waiting...</Text>
                  <Text style={styles.emptyRowText}>2nd place waiting...</Text>
                  <Text style={styles.emptyRowText}>3rd place waiting...</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            {regularSubmissions.length > 0 ? (
              regularSubmissions.map((submission) => (
                <CommunitySubmissionRow
                  key={submission.id}
                  submission={submission}
                  onOpenPreview={(uri) => {
                    setPreviewUri(uri);
                    setPreviewTitle(submission.group.name);
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyGallery}>
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyGalleryText}>
                  No photos yet. Submit first and set the pace.
                </Text>
              </View>
            )}
          </View>

          {!hasAnySubmissions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Motivation</Text>
              <Text style={styles.motivationText}>
                Be the first group to post a submission and claim the top spot.
              </Text>
            </View>
          )}
        </View>
      )}

      <Modal
        visible={Boolean(previewUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.previewBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewUri(null)} />
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{previewTitle}</Text>
              <Ionicons name="close" size={20} color={colors.white} />
            </View>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CommunitySubmissionRow({
  submission,
  onOpenPreview,
}: {
  submission: CommunitySubmission;
  onOpenPreview: (uri: string) => void;
}) {
  const hasImage = submission.imageIds.length > 0;
  const {
    download,
    status,
    file,
    reset,
    abort,
  } = useFileDownload();

  useEffect(() => {
    if (!hasImage) {
      reset();
      return;
    }

    reset();
    void download({
      storagePath: submission.imageIds[0] ?? "",
    }).catch(() => {
      // Keep row visible even if object is temporarily unavailable.
    });

    return () => {
      abort();
    };
  }, [abort, download, hasImage, reset, submission.imageIds]);

  const rankingStyle =
    typeof submission.ranking === "number" ? placeStyleMap[submission.ranking] : undefined;

  return (
    <View
      style={[
        styles.rowCard,
        rankingStyle ? { borderColor: rankingStyle.borderColor } : undefined,
      ]}
    >
      <View style={styles.rowMeta}>
        <View style={styles.rowTop}>
          <Text style={styles.groupName}>{submission.group.name}</Text>
        </View>
        <Text style={styles.dateText}>{formatDateTime(submission.createdAt)}</Text>
        {rankingStyle ? (
          <Text style={[styles.placeText, { color: rankingStyle.borderColor }]}>
            {rankingStyle.label}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.thumbWrap}
        disabled={!file?.uri}
        onPress={() => {
          if (file?.uri) onOpenPreview(file.uri);
        }}
      >
        {hasImage ? (
          status === "loading" ? (
            <View style={styles.thumbFallback}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : file?.uri ? (
            <Image source={{ uri: file.uri }} style={styles.thumbImage} />
          ) : (
            <View style={styles.thumbFallback}>
              <Ionicons name="image-outline" size={16} color={colors.textMuted} />
            </View>
          )
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function PodiumPreviewTile({
  rank,
  submission,
  onOpenPreview,
}: {
  rank: number;
  submission?: CommunitySubmission;
  onOpenPreview: (uri: string) => void;
}) {
  const hasImage = Boolean(submission?.imageIds?.length);
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission || !hasImage) {
      reset();
      return;
    }

    reset();
    void download({
      storagePath: submission.imageIds[0] ?? "",
    }).catch(() => {});

    return () => {
      abort();
    };
  }, [abort, download, hasImage, reset, submission]);

  const placeStyle = placeStyleMap[rank];

  return (
    <TouchableOpacity
      disabled={!file?.uri}
      onPress={() => {
        if (file?.uri) onOpenPreview(file.uri);
      }}
      style={[
        styles.podiumPreviewItem,
        placeStyle ? { borderColor: placeStyle.borderColor } : undefined,
      ]}
    >
      <View style={styles.podiumPreviewThumb}>
        {submission ? (
          status === "loading" ? (
            <View style={styles.thumbFallback}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : file?.uri ? (
            <Image source={{ uri: file.uri }} style={styles.thumbImage} />
          ) : (
            <View style={styles.thumbFallback}>
              <Ionicons name="image-outline" size={14} color={colors.textMuted} />
            </View>
          )
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons name="trophy-outline" size={14} color={colors.textMuted} />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.podiumPreviewLabel,
          placeStyle ? { color: placeStyle.borderColor } : undefined,
        ]}
      >
        #{rank}
      </Text>
    </TouchableOpacity>
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
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  podiumPreviewRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  podiumPreviewItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDark,
    padding: 6,
    gap: 4,
  },
  podiumPreviewThumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: colors.cardDark,
  },
  podiumPreviewLabel: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.bold,
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
  rowCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceDark,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyRow: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderStyle: "dashed",
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: 6,
  },
  emptyRowText: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: typography.bold,
  },
  emptyGallery: {
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
  motivationText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    lineHeight: 20,
  },
  rowMeta: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  groupName: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    flexShrink: 1,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  placeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: colors.cardDark,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  previewCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  previewHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  previewTitle: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceDark,
  },
});
