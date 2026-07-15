import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { borderRadius, colors, glow, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface PrimaryLoadingButtonProps {
  label: string;
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  testID?: string;
}

export function PrimaryLoadingButton({
  label,
  isLoading,
  onPress,
  disabled = false,
  style,
  textStyle,
  activeOpacity = 0.9,
  testID,
}: PrimaryLoadingButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const isDisabled = isLoading || disabled;

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.button, glow(palette.primary), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
    >
      {isLoading ? (
        <Skeleton.Line
          count={1}
          height={typography.base}
          style={styles.skeletonContainer}
          testID={`${testID}-loading-skeleton`}
          width="75%"
        />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    button: {
      backgroundColor: palette.primary,
      paddingVertical: spacing.lg,
      borderRadius: borderRadius.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontSize: typography.base,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
    },
    skeletonContainer: {
      alignItems: "center",
    },
  });
}
