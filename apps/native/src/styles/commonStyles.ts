import { StyleSheet } from "react-native";
import { colors } from "./colors";
import { spacing, borderRadius } from "./spacing";
import { typography } from "./typography";
import { shadows } from "./shadows";

export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },

  // Card styles
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },

  cardGlass: {
    backgroundColor: colors.cardDarkOpacity70,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
  },

  // Text styles
  textPrimary: {
    color: colors.textPrimary,
    fontSize: typography.base,
  },

  textSecondary: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },

  textBold: {
    fontWeight: typography.bold,
  },

  textUppercase: {
    textTransform: "uppercase",
  },

  // Heading styles
  h1: {
    fontSize: typography.huge,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },

  h2: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
  },

  h3: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
  },

  h4: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },

  // Label styles
  label: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  labelPrimary: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },

  // Button styles
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: colors.backgroundDark,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },

  // Icon wrapper styles
  iconWrapper: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapperPrimary: {
    padding: spacing.sm,
    backgroundColor: colors.primaryOpacity10,
    borderRadius: borderRadius.sm,
  },

  iconWrapperMagenta: {
    padding: spacing.sm,
    backgroundColor: colors.magentaOpacity10,
    borderRadius: borderRadius.sm,
  },

  // Flex utilities
  flexRow: {
    flexDirection: "row",
  },

  flexColumn: {
    flexDirection: "column",
  },

  flexCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  flexBetween: {
    justifyContent: "space-between",
  },

  flex1: {
    flex: 1,
  },

  // Spacing utilities
  gap4: { gap: spacing.xs },
  gap8: { gap: spacing.sm },
  gap12: { gap: spacing.md },
  gap16: { gap: spacing.lg },
  gap24: { gap: spacing.xxl },

  // Margin utilities
  mb8: { marginBottom: spacing.sm },
  mb12: { marginBottom: spacing.md },
  mb16: { marginBottom: spacing.lg },
  mb24: { marginBottom: spacing.xxl },

  mt8: { marginTop: spacing.sm },
  mt16: { marginTop: spacing.lg },
  mt24: { marginTop: spacing.xxl },

  // Padding utilities
  p16: { padding: spacing.lg },
  p24: { padding: spacing.xxl },

  px16: { paddingHorizontal: spacing.lg },
  py16: { paddingVertical: spacing.lg },

  // Border utilities
  borderPrimary: {
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
  },

  borderWhite5: {
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },

  // Shadow utilities
  shadowSmall: shadows.small,
  shadowMedium: shadows.medium,
  shadowLarge: shadows.large,
  shadowXL: shadows.xl,
  shadowPrimaryGlow: shadows.primaryGlow,
});
