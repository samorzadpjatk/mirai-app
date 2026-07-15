import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import type { VotingSubmission } from "~/hooks/admin/useStaffVoting";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface SubmissionImageCardProps {
  submission: VotingSubmission;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function SubmissionImageCard({
  submission,
  title,
  subtitle,
  onPress,
  disabled = false,
}: SubmissionImageCardProps) {
  const styles = useThemedStyles(makeStyles);
  const content = (
    <View style={styles.voteCard}>
      <View style={styles.voteImageWrap}>
        <CachedImage
          storagePath={submission.imagePath ?? undefined}
          style={styles.voteImage}
          contentFit="cover"
          fallback={
            <View style={styles.voteImageFallback}>
              <Text style={styles.voteImageFallbackText}>
                {submission.groupName.charAt(0).toUpperCase()}
              </Text>
            </View>
          }
        />
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
    },
    voteImageFallbackText: {
      color: colors.textMuted,
      fontSize: typography.xl,
      fontWeight: typography.bold,
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
      color: colors.textMuted,
      fontSize: typography.xs,
    },
  });
}
