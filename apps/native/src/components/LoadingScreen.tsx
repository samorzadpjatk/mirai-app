import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "~/components/ui/Skeleton";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={[styles.mainContent, { paddingTop: insets.top + spacing.lg }]}>
          <Skeleton.Group testID="loading-screen-skeleton">
            <Skeleton
              colors={{ base: palette.surfaceDark, highlight: palette.primary }}
              height={80}
              variant="box"
              width={80}
            />
            <Skeleton.Line
              colors={{ base: palette.surfaceDark, highlight: palette.primary }}
              count={2}
              width={160}
            />
          </Skeleton.Group>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
      alignItems: "center",
      justifyContent: "center",
    },
    mainContent: {
      flex: 1,
      alignSelf: "stretch",
      padding: spacing.lg,
      paddingBottom: 120,
      gap: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    message: {
      marginTop: spacing.md,
      color: palette.white,
      fontSize: typography.lg,
      fontWeight: typography.medium,
      lineHeight: typography.lg * typography.normalLine,
      textAlign: "center",
    },
  });
}
