import { StyleSheet } from "react-native";
import { colors } from "~/styles/colors";
import { spacing, borderRadius } from "~/styles/spacing";
import { typography } from "~/styles/typography";
import { shadows } from "~/styles/shadows";

const viewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    ...shadows.large,
  },
  cardBack: {
    position: "absolute",
    width: "100%",
    transform: [{ scale: 0.96 }, { translateY: 12 }],
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryOpacity20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    overflow: "hidden",
  },
  groupAvatarImage: {
    width: "100%",
    height: "100%",
  },
  groupMeta: {
    flex: 1,
  },
  mediaWrapper: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceDark,
  },
  mediaImage: {
    width: "100%",
    height: 260,
  },
  mediaLoading: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBadge: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.blackOpacity40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  videoPlaceholder: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceDark,
  },
  fullscreenImageContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  fullscreenImageClose: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.blackOpacity40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  textBlock: {
    backgroundColor: colors.backgroundDarkOpacity50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  stamp: {
    position: "absolute",
    top: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stampApprove: {
    right: spacing.lg,
    borderColor: colors.primary,
  },
  stampReject: {
    right: spacing.lg,
    borderColor: colors.red400,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: colors.red400,
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
  actionHint: {
    alignItems: "center",
    gap: spacing.xs,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  rejectReasonBackdrop: {
    flex: 1,
    backgroundColor: colors.backgroundDarkOpacity80,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  rejectReasonCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rejectReasonInput: {
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 96,
    textAlignVertical: "top",
    fontSize: typography.base,
  },
  rejectReasonActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  rejectReasonCancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceDark,
  },
  rejectReasonConfirmButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.red400,
  },
  rejectReasonConfirmButtonDisabled: {
    opacity: 0.5,
  },
});

const textStyles = StyleSheet.create({
  headerTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginTop: spacing.xs,
  },
  groupAvatarText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  groupName: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  groupHint: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginTop: spacing.xs,
  },
  mediaBadgeText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  videoLabel: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginTop: spacing.sm,
  },
  textContent: {
    color: colors.white,
    fontSize: typography.base,
    lineHeight: 22,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  cardPlaceholderText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  stampTextApprove: {
    color: colors.primary,
    fontWeight: typography.bold,
    letterSpacing: 1,
  },
  stampTextReject: {
    color: colors.red400,
    fontWeight: typography.bold,
    letterSpacing: 1,
  },
  actionHintText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: "center",
  },
  rejectReasonTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  rejectReasonSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  rejectReasonCancelText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  rejectReasonConfirmText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
});

export { viewStyles, textStyles };
