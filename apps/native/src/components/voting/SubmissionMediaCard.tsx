import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { SubmissionVideoPlayer } from "~/components/common/SubmissionVideoPlayer";
import type { VotingSubmission } from "~/hooks/voting/useVotingDeck";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface SubmissionMediaCardProps {
  submission: VotingSubmission;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}

/**
 * One entry of a voting deck. Renders whatever media the submission actually has -
 * image, video, or plain text - so that video and text submissions can be voted on
 * instead of being dropped from the deck.
 */
export function SubmissionMediaCard({
  submission,
  title,
  subtitle,
  onPress,
  disabled = false,
}: SubmissionMediaCardProps) {
  const styles = useThemedStyles(makeStyles);
  const fallback = (
    <View style={styles.voteImageFallback}>
      {submission.textContent ? (
        <Text style={styles.voteTextContent} numberOfLines={6}>
          {submission.textContent}
        </Text>
      ) : (
        <Text style={styles.voteImageFallbackText}>
          {submission.groupName.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );

  const content = (
    <View style={styles.voteCard}>
      <View style={styles.voteImageWrap}>
        {submission.imagePath ? (
          <CachedImage
            storagePath={submission.imagePath}
            transform="feedCard"
            style={styles.voteImage}
            contentFit="cover"
            fallback={fallback}
          />
        ) : submission.videoPath ? (
          <SubmissionVideoPlayer storagePath={submission.videoPath} placeholderIconSize={40} />
        ) : (
          fallback
        )}
      </View>
      <View style={styles.voteCardBody}>
        <Text style={styles.voteCardTitle}>{title}</Text>
        <Text style={styles.voteCardGroup}>{submission.groupName}</Text>
        {subtitle ? <Text style={styles.voteCardSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled}>
      {content}
    </TouchableOpacity>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    voteCard: {
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      borderRadius: borderRadius.xl,
      overflow: "hidden",
    },
    voteImageWrap: {
      width: "100%",
      aspectRatio: 16 / 10,
      backgroundColor: "rgba(15,23,42,0.5)",
    },
    voteImage: {
      width: "100%",
      height: "100%",
    },
    voteImageFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
    },
    voteImageFallbackText: {
      color: palette.textMuted,
      fontSize: typography.xl,
      fontWeight: typography.bold,
    },
    voteTextContent: {
      color: colors.white,
      fontSize: typography.base,
      lineHeight: 22,
      textAlign: "center",
    },
    voteCardBody: {
      padding: spacing.md,
      gap: 2,
    },
    voteCardTitle: {
      color: palette.primary,
      fontSize: typography.sm,
      fontWeight: typography.bold,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    voteCardGroup: {
      color: colors.white,
      fontSize: typography.base,
      fontWeight: typography.bold,
    },
    voteCardSubtitle: {
      color: palette.textMuted,
      fontSize: typography.xs,
    },
  });
}
