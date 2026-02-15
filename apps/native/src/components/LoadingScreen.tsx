import { View, Text, ActivityIndicator } from "react-native";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { colors, spacing, typography } from "../styles";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  const insets = useAppSafeAreaInsets();
  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View
          style={[styles.mainContent, { paddingTop: insets.top + spacing.lg }]}
        >
          <ActivityIndicator size="large" color="#00ced1" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
    color: "#ffffff",
    fontSize: typography.lg,
    fontWeight: typography.medium,
    lineHeight: typography.lg * typography.normalLine,
    textAlign: "center",
  },
});
